import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, UserRole, RouteGroup, PackageData, ScanLog, ScanStatus } from '../types';
import { playFeedbackSound } from '../utils/audio';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { generateSafeId } from '../utils/helpers';

interface AppState {
  currentUser: User | null;
  users: User[];
  routes: RouteGroup[];
  packages: Map<string, string>; // In-memory cache for ultra-fast validation
  scans: ScanLog[];
  activeOperatorRoutes: Map<string, string>;
  isLoading: boolean;
  
  // Actions
  login: (login: string, pass: string) => Promise<boolean>;
  logout: () => void;
  addUser: (user: User) => Promise<void>;
  updateUser: (user: User) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  addRoute: (route: RouteGroup) => Promise<void>;
  updateRoute: (route: RouteGroup) => Promise<void>;
  deleteRoute: (id: string) => Promise<void>;
  importRoutes: (newRoutes: RouteGroup[]) => Promise<void>;
  toggleRouteStatus: (id: string, status: boolean) => Promise<void>;
  importPackages: (data: PackageData[]) => Promise<void>;
  processScan: (trackingCode: string, routeId: string, manualMode: boolean) => { status: ScanStatus; message: string };
  clearDailyData: () => Promise<void>;
  assignOperatorRoute: (operatorId: string, routeId: string | null) => void;
}

const AppContext = createContext<AppState | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [routes, setRoutes] = useState<RouteGroup[]>([]);
  const [packages, setPackages] = useState<Map<string, string>>(new Map());
  const [scans, setScans] = useState<ScanLog[]>([]);
  const [activeOperatorRoutes, setActiveOperatorRoutes] = useState<Map<string, string>>(new Map());
  const [isLoading, setIsLoading] = useState(true);

  // --- Initial Data Fetching ---
  useEffect(() => {
    if (!isSupabaseConfigured()) {
        console.warn("Supabase credentials missing.");
        setIsLoading(false);
        return;
    }

    const loadData = async () => {
        setIsLoading(true);
        try {
            // 1. Load Users
            const { data: usersData } = await supabase.from('app_users').select('*');
            if (usersData) setUsers(usersData);

            // 2. Load Routes
            const { data: routesData } = await supabase.from('routes').select('*');
            if (routesData) {
                // Ensure category has a default value if DB returns null (migration safety)
                const sanitizedRoutes = routesData.map(r => ({
                    ...r,
                    category: r.category || 'A'
                }));
                setRoutes(sanitizedRoutes);
            }

            // 3. Load Packages (Optimize: Only select needed columns)
            const { data: packagesData, error } = await supabase.from('packages').select('tracking_code, cep').limit(10000);
            
            if (packagesData) {
                const map = new Map<string, string>();
                packagesData.forEach(p => map.set(p.tracking_code, p.cep));
                setPackages(map);
            }

            // 4. Load Today's Scans
            const today = new Date();
            today.setHours(0,0,0,0);
            const { data: scansData } = await supabase
                .from('scans')
                .select('*')
                .gte('created_at', today.toISOString())
                .order('created_at', { ascending: false });
            
            if (scansData) {
                 const formattedScans: ScanLog[] = scansData.map(s => ({
                     ...s,
                     timestamp: new Date(s.created_at).getTime(),
                     operatorName: s.operator_name, 
                     routeName: s.route_name,
                     trackingCode: s.tracking_code,
                     routeId: s.route_id,
                     operatorId: s.operator_id
                 }));
                 setScans(formattedScans);
            }

        } catch (error) {
            console.error("Error loading initial data", error);
        } finally {
            setIsLoading(false);
        }
    };

    loadData();

    // --- Realtime Subscription ---
    const subscription = supabase
        .channel('public:scans')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'scans' }, (payload) => {
            const newScan = payload.new;
            setScans(prev => {
                if (prev.some(s => s.id === newScan.id)) return prev;
                
                const formatted: ScanLog = {
                    id: newScan.id,
                    timestamp: new Date(newScan.created_at).getTime(),
                    operatorId: newScan.operator_id,
                    operatorName: newScan.operator_name,
                    routeId: newScan.route_id,
                    routeName: newScan.route_name,
                    trackingCode: newScan.tracking_code,
                    status: newScan.status as ScanStatus,
                    message: newScan.message
                };
                return [formatted, ...prev];
            });
        })
        .subscribe();

    return () => {
        supabase.removeChannel(subscription);
    };

  }, []);

  // --- Auth ---
  const login = async (login: string, pass: string) => {
    if (!isSupabaseConfigured()) return false;

    const { data, error } = await supabase
        .from('app_users')
        .select('*')
        .eq('login', login)
        .eq('password', pass)
        .eq('active', true)
        .single();

    if (data && !error) {
        setCurrentUser(data as User);
        return true;
    }
    return false;
  };

  const logout = () => setCurrentUser(null);

  // --- User Management ---
  const addUser = async (user: User) => {
    setUsers([...users, user]);
    await supabase.from('app_users').insert({
        id: user.id,
        name: user.name,
        login: user.login,
        password: user.password,
        role: user.role,
        active: user.active
    });
  };

  const updateUser = async (updatedUser: User) => {
    setUsers(users.map(u => u.id === updatedUser.id ? updatedUser : u));
    await supabase.from('app_users').update({
        name: updatedUser.name,
        login: updatedUser.login,
        password: updatedUser.password,
        role: updatedUser.role,
        active: updatedUser.active
    }).eq('id', updatedUser.id);
  };

  const deleteUser = async (id: string) => {
    setUsers(users.filter(u => u.id !== id));
    await supabase.from('app_users').delete().eq('id', id);
  };

  // --- Route Management ---
  const addRoute = async (route: RouteGroup) => {
    setRoutes([...routes, route]);
    await supabase.from('routes').insert({
        ...route,
        category: route.category || 'A' // Ensure category
    });
  };

  const importRoutes = async (newRoutes: RouteGroup[]) => {
    setRoutes([...routes, ...newRoutes]);
    // Ensure all have category
    const dbRoutes = newRoutes.map(r => ({ ...r, category: r.category || 'A' }));
    const { error } = await supabase.from('routes').insert(dbRoutes);
    if (error) console.error("Error batch importing routes", error);
  };

  const updateRoute = async (updatedRoute: RouteGroup) => {
    setRoutes(prev => prev.map(r => r.id === updatedRoute.id ? updatedRoute : r));
    await supabase.from('routes').update({
        name: updatedRoute.name,
        ceps: updatedRoute.ceps,
        category: updatedRoute.category || 'A',
        completed: updatedRoute.completed
    }).eq('id', updatedRoute.id);
  };

  const deleteRoute = async (id: string) => {
    setRoutes(prev => prev.filter(r => r.id !== id));
    await supabase.from('routes').delete().eq('id', id);
  };
  
  const toggleRouteStatus = async (id: string, status: boolean) => {
    setRoutes(routes.map(r => r.id === id ? { ...r, completed: status } : r));
    await supabase.from('routes').update({ completed: status }).eq('id', id);
  };

  const assignOperatorRoute = (operatorId: string, routeId: string | null) => {
    const newMap = new Map(activeOperatorRoutes);
    if (routeId) {
      newMap.set(operatorId, routeId);
    } else {
      newMap.delete(operatorId);
    }
    setActiveOperatorRoutes(newMap);
  };

  // --- Import ---
  const importPackages = async (data: PackageData[]) => {
    if (!isSupabaseConfigured()) return;
    setIsLoading(true);

    const newMap = new Map(packages);
    data.forEach(p => newMap.set(p.trackingCode, p.cep));
    setPackages(newMap);

    const CHUNK_SIZE = 1000;
    for (let i = 0; i < data.length; i += CHUNK_SIZE) {
        const chunk = data.slice(i, i + CHUNK_SIZE).map(d => ({
            tracking_code: d.trackingCode,
            cep: d.cep
        }));
        const { error } = await supabase.from('packages').upsert(chunk, { onConflict: 'tracking_code' });
        if (error) console.error("Error upserting packages chunk", error);
    }
    setIsLoading(false);
  };

  const clearDailyData = async () => {
    setPackages(new Map());
    setScans([]);
    setActiveOperatorRoutes(new Map());
    await supabase.from('packages').delete().neq('tracking_code', '0');
    await supabase.from('scans').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('routes').update({ completed: false }).neq('id', '00000000-0000-0000-0000-000000000000');
  };

  // --- Scanning Logic ---
  const processScan = useCallback((trackingCode: string, routeId: string, manualMode: boolean): { status: ScanStatus; message: string } => {
    if (!currentUser) return { status: ScanStatus.ERROR_INVALID, message: "Não logado" };

    const route = routes.find(r => r.id === routeId);
    if (!route) return { status: ScanStatus.ERROR_INVALID, message: "Rota inválida" };

    if (!trackingCode.toUpperCase().startsWith('BR')) {
      playFeedbackSound('error');
      return { status: ScanStatus.ERROR_INVALID, message: "Código deve começar com BR" };
    }

    const isDuplicate = scans.some(s => s.trackingCode === trackingCode && (s.status === ScanStatus.SUCCESS || s.status === ScanStatus.MANUAL));
    if (isDuplicate) {
      playFeedbackSound('warning');
      const errorLog: ScanLog = {
        id: generateSafeId(),
        timestamp: Date.now(),
        operatorId: currentUser.id,
        operatorName: currentUser.name,
        routeId: route.id,
        routeName: route.name,
        trackingCode,
        status: ScanStatus.ERROR_DUPLICATE,
        message: "Duplicado"
      };
      setScans(prev => [errorLog, ...prev]);
      supabase.from('scans').insert({
          id: errorLog.id,
          operator_id: currentUser.id,
          operator_name: currentUser.name,
          route_id: route.id,
          route_name: route.name,
          tracking_code: trackingCode,
          status: ScanStatus.ERROR_DUPLICATE,
          message: "Duplicado",
          created_at: new Date().toISOString()
      }).then(({ error }) => { if(error) console.error(error) });

      return { status: ScanStatus.ERROR_DUPLICATE, message: "Pacote Duplicado" };
    }

    const pkgCep = packages.get(trackingCode);
    let finalStatus: ScanStatus = ScanStatus.ERROR_NOT_FOUND;
    let message = "Pacote não encontrado";

    if (pkgCep) {
      const cleanPkgCep = pkgCep.replace(/\D/g, '');
      const routeCeps = route.ceps.map(c => c.replace(/\D/g, ''));
      const match = routeCeps.length === 0 || routeCeps.some(rc => cleanPkgCep.startsWith(rc));

      if (match) {
        finalStatus = ScanStatus.SUCCESS;
        message = "Sucesso";
        playFeedbackSound('success');
      } else {
        finalStatus = ScanStatus.ERROR_ROUTE;
        message = `CEP Inválido para Rota`;
        playFeedbackSound('error');
      }
    } else {
      if (manualMode) {
        finalStatus = ScanStatus.MANUAL;
        message = "Adicionado Manualmente";
        playFeedbackSound('success');
      } else {
        finalStatus = ScanStatus.ERROR_NOT_FOUND;
        message = "Não Encontrado";
        playFeedbackSound('error');
      }
    }

    const newScan: ScanLog = {
      id: generateSafeId(),
      timestamp: Date.now(),
      operatorId: currentUser.id,
      operatorName: currentUser.name,
      routeId: route.id,
      routeName: route.name,
      trackingCode,
      status: finalStatus,
      message
    };

    setScans(prev => [newScan, ...prev]);

    supabase.from('scans').insert({
        id: newScan.id,
        operator_id: currentUser.id,
        operator_name: currentUser.name,
        route_id: route.id,
        route_name: route.name,
        tracking_code: trackingCode,
        status: finalStatus,
        message: message,
        created_at: new Date().toISOString()
    }).then(({ error }) => {
        if (error) console.error("Failed to sync scan to DB", error);
    });

    return { status: finalStatus, message };

  }, [currentUser, routes, packages, scans]);

  return (
    <AppContext.Provider value={{
      currentUser, users, routes, packages, scans, activeOperatorRoutes, isLoading,
      login, logout, addUser, updateUser, deleteUser,
      addRoute, updateRoute, deleteRoute, importRoutes, toggleRouteStatus, assignOperatorRoute,
      importPackages, processScan, clearDailyData
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within AppProvider");
  return context;
};