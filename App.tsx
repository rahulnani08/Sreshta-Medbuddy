import React, { useState, useEffect } from 'react';
import { User, UserType, ViewState, TabState, SyncConfig } from './types';
import { getUsers, saveUser, deleteUser, exportData, importData, getSyncConfig, saveSyncConfig, clearSyncConfig, syncFromCloud, getSyncStatus, subscribe } from './services/storageService';
import { FeverTracker } from './components/FeverTracker';
import { PrescriptionList } from './components/PrescriptionList';
import { Button, Card, Input, Modal, cn } from './components/Shared';
import { UserPlus, ArrowLeft, Settings, Activity, Pill, Download, Upload, Trash2, Thermometer, Cloud, Check, Loader2, AlertCircle, Github, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';

type RootTab = 'TRACKER' | 'MEDICINES';

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('HOME');
  const [rootTab, setRootTab] = useState<RootTab>('TRACKER');
  
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  // New User Form
  const [newUserName, setNewUserName] = useState('');
  const [newUserType, setNewUserType] = useState<UserType>(UserType.ADULT);

  // Sync State
  const [syncStatus, setSyncStatus] = useState(getSyncStatus());
  const [syncConfig, setSyncConfig] = useState<SyncConfig | null>(null);
  const [tempToken, setTempToken] = useState('');
  const [tempRepo, setTempRepo] = useState('');

  const refreshData = () => {
    setUsers(getUsers());
    setSyncStatus(getSyncStatus());
    setSyncConfig(getSyncConfig());
  };

  useEffect(() => {
    refreshData();
    // Try initial pull if configured
    if (getSyncConfig()) {
        syncFromCloud();
    }
    const unsubscribe = subscribe(refreshData);
    return () => unsubscribe();
  }, []);

  // Update Settings form when opening
  useEffect(() => {
    if (isSettingsOpen) {
      const current = getSyncConfig();
      if (current) {
        setTempToken(current.token);
        setTempRepo(current.repo);
      }
    }
  }, [isSettingsOpen]);

  const handleAddUser = async () => {
    if (!newUserName) return;
    const newUser: User = {
      id: crypto.randomUUID(),
      name: newUserName,
      type: newUserType,
      createdAt: Date.now()
    };
    await saveUser(newUser);
    setIsAddUserOpen(false);
    setNewUserName('');
  };

  const handleUserSelect = (user: User) => {
    setSelectedUser(user);
    setView('USER_PROFILE');
  };

  const handleBack = () => {
    setView('HOME');
    setSelectedUser(null);
  };

  const handleDeleteUser = async (userId: string) => {
      if(window.confirm('Delete this user and all their data? This cannot be undone.')) {
          await deleteUser(userId);
      }
  };

  const handleExport = () => {
    const data = exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sreshta-medbuddy-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
          const success = importData(ev.target?.result as string);
          if (success) {
              alert('Data imported successfully!');
              setIsSettingsOpen(false);
          } else {
              alert('Invalid backup file.');
          }
      };
      reader.readAsText(file);
  };

  const handleSaveSyncConfig = async () => {
    if (!tempToken || !tempRepo) return;
    await saveSyncConfig({
      token: tempToken,
      repo: tempRepo,
      path: 'medbuddy_data.json'
    });
    alert('Sync configured! The app will now try to sync with your repository.');
  };

  const handleDisconnectSync = () => {
    if (window.confirm('Stop syncing? Data will remain on this device but stop updating to GitHub.')) {
      clearSyncConfig();
      setTempToken('');
      setTempRepo('');
      refreshData();
    }
  };

  const handleForceSync = async () => {
    await syncFromCloud(true);
  };

  // --- Main Views ---

  const renderTrackerView = () => (
    <div className="max-w-md mx-auto min-h-screen p-6 pb-24">
      <header className="flex justify-between items-center mb-8">
        <div>
           <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
             Fever Tracker
             {syncStatus.isSyncing && <Loader2 className="w-4 h-4 animate-spin text-teal-500" />}
           </h1>
           <p className="text-slate-500 text-sm">Select a profile to log temperature</p>
        </div>
        <button onClick={() => setIsSettingsOpen(true)} className="relative p-2 bg-slate-100 rounded-full text-slate-600 hover:bg-slate-200 transition-colors">
           <Settings className="w-5 h-5" />
           {syncConfig && !syncStatus.isSyncing && !syncStatus.syncError && (
             <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white"></span>
           )}
           {syncStatus.syncError && (
             <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
           )}
        </button>
      </header>

      <div className="grid grid-cols-2 gap-4">
        {users.map(user => (
          <Card key={user.id} onClick={() => handleUserSelect(user)} className="flex flex-col items-center justify-center py-8 gap-3 border-2 border-transparent hover:border-teal-500 hover:shadow-md">
             <div className={cn("w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-white shadow-lg", 
                user.type === UserType.KID ? "bg-gradient-to-br from-pink-400 to-orange-400" : "bg-gradient-to-br from-blue-400 to-teal-400")}>
                {user.name.charAt(0).toUpperCase()}
             </div>
             <div className="text-center">
               <h3 className="font-bold text-slate-800 truncate max-w-[120px]">{user.name}</h3>
               <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{user.type}</span>
             </div>
          </Card>
        ))}
        
        <button 
          onClick={() => setIsAddUserOpen(true)}
          className="flex flex-col items-center justify-center py-8 gap-3 rounded-2xl border-2 border-dashed border-slate-300 text-slate-400 hover:border-teal-500 hover:text-teal-600 hover:bg-teal-50 transition-all"
        >
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center">
            <UserPlus className="w-6 h-6" />
          </div>
          <span className="font-semibold text-sm">Add Profile</span>
        </button>
      </div>

      {users.length === 0 && (
         <div className="mt-12 text-center p-8 bg-blue-50 rounded-3xl">
            <Thermometer className="w-12 h-12 text-blue-300 mx-auto mb-3" />
            <p className="text-blue-800 font-medium mb-2">Welcome to Sreshta Medbuddy!</p>
            <p className="text-blue-600 text-sm">Start by adding a family member profile to track fevers.</p>
         </div>
      )}
    </div>
  );

  const renderMedicineView = () => (
    <div className="max-w-md mx-auto min-h-screen p-6 bg-slate-50">
       <header className="flex justify-between items-center mb-6">
        <div>
           <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
             Medicine Cabinet
             {syncStatus.isSyncing && <Loader2 className="w-4 h-4 animate-spin text-blue-500" />}
           </h1>
           <p className="text-slate-500 text-sm">Manage family prescriptions</p>
        </div>
        <button onClick={() => setIsSettingsOpen(true)} className="relative p-2 bg-white border border-slate-200 rounded-full text-slate-600 hover:bg-slate-50 transition-colors">
           <Settings className="w-5 h-5" />
           {syncConfig && !syncStatus.isSyncing && !syncStatus.syncError && (
             <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white"></span>
           )}
           {syncStatus.syncError && (
             <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
           )}
        </button>
      </header>
      <PrescriptionList users={users} />
    </div>
  );

  const renderHome = () => (
    <>
      {rootTab === 'TRACKER' ? renderTrackerView() : renderMedicineView()}
      
      {/* Root Bottom Navigation */}
      <div className="fixed bottom-0 left-0 w-full bg-white border-t border-slate-200 px-6 py-3 flex justify-around items-center z-40 safe-area-bottom shadow-lg">
         <button onClick={() => setRootTab('TRACKER')} className={cn("flex flex-col items-center gap-1 transition-colors w-20", rootTab === 'TRACKER' ? "text-teal-600" : "text-slate-400")}>
           <Thermometer className="w-6 h-6" />
           <span className="text-[10px] font-bold">Fever</span>
         </button>
         <div className="w-px h-8 bg-slate-200"></div>
         <button onClick={() => setRootTab('MEDICINES')} className={cn("flex flex-col items-center gap-1 transition-colors w-20", rootTab === 'MEDICINES' ? "text-blue-600" : "text-slate-400")}>
           <Pill className="w-6 h-6" />
           <span className="text-[10px] font-bold">Medicines</span>
         </button>
      </div>
    </>
  );

  const renderUserProfile = () => {
    if (!selectedUser) return null;
    return (
      <div className="max-w-md mx-auto min-h-screen bg-slate-50">
        <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={handleBack} className="p-2 -ml-2 hover:bg-slate-100 rounded-full transition-colors">
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </button>
            <div>
              <h2 className="font-bold text-slate-800 leading-tight">{selectedUser.name}</h2>
              <span className="text-xs text-slate-500">{selectedUser.type}</span>
            </div>
          </div>
          <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-sm", 
                selectedUser.type === UserType.KID ? "bg-gradient-to-br from-pink-400 to-orange-400" : "bg-gradient-to-br from-blue-400 to-teal-400")}>
                {selectedUser.name.charAt(0).toUpperCase()}
          </div>
        </div>

        <div className="p-6 pb-24">
          <FeverTracker user={selectedUser} />
        </div>

        <div className="fixed bottom-0 left-0 w-full bg-white border-t border-slate-200 px-6 py-3 flex justify-center items-center z-40 safe-area-bottom">
           <div className={cn("flex flex-col items-center gap-1 transition-colors w-24 text-teal-600")}>
             <Activity className="w-6 h-6" />
             <span className="text-[10px] font-bold">Fever History</span>
           </div>
        </div>
      </div>
    );
  };

  return (
    <>
      {view === 'HOME' ? renderHome() : renderUserProfile()}

      <Modal isOpen={isAddUserOpen} onClose={() => setIsAddUserOpen(false)} title="New Profile">
        <div className="space-y-4">
           <Input 
             label="Name" 
             placeholder="e.g. Rahul" 
             value={newUserName} 
             onChange={(e) => setNewUserName(e.target.value)} 
             autoFocus 
           />
           <div>
             <label className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5 block">Type</label>
             <div className="flex gap-2">
                {(Object.values(UserType) as UserType[]).map(type => (
                  <button
                    key={type}
                    onClick={() => setNewUserType(type)}
                    className={cn(
                      "flex-1 py-2 rounded-xl text-sm font-medium border transition-all",
                      newUserType === type 
                        ? "bg-teal-50 border-teal-500 text-teal-700" 
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                    )}
                  >
                    {type}
                  </button>
                ))}
             </div>
           </div>
           <Button onClick={handleAddUser} className="w-full mt-2">Create Profile</Button>
        </div>
      </Modal>

      <Modal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} title="Settings">
        <div className="space-y-8 pb-4">
           
           {/* CLOUD SYNC SECTION */}
           <div>
             <h4 className="font-semibold text-slate-800 mb-2 flex items-center gap-2">
               <Cloud className="w-4 h-4 text-blue-500" /> Cloud Sync (GitHub)
             </h4>
             <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                {!syncConfig ? (
                  <div className="space-y-3">
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Sync data across devices using a free GitHub private repository.
                      <br/>1. Create a <a href="https://github.com/new" target="_blank" className="text-blue-600 underline">new repository</a>.
                      <br/>2. Generate a <a href="https://github.com/settings/tokens" target="_blank" className="text-blue-600 underline">Personal Access Token (Classic)</a> with 'repo' scope.
                    </p>
                    <Input 
                      label="GitHub Token" 
                      type="password"
                      placeholder="ghp_xxxxxxxxxxxx" 
                      value={tempToken} 
                      onChange={(e) => setTempToken(e.target.value)} 
                    />
                    <Input 
                      label="Repository (username/repo)" 
                      placeholder="johndoe/my-health-data" 
                      value={tempRepo} 
                      onChange={(e) => setTempRepo(e.target.value)} 
                    />
                    <Button onClick={handleSaveSyncConfig} disabled={!tempToken || !tempRepo} className="w-full bg-slate-800 hover:bg-slate-900 text-white shadow-slate-900/10">
                      <Github className="w-4 h-4" /> Connect GitHub
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-sm text-slate-700 bg-white p-3 rounded-lg border border-slate-100">
                      <div className="bg-green-100 p-1.5 rounded-full">
                         <Check className="w-4 h-4 text-green-600" />
                      </div>
                      <div className="overflow-hidden">
                        <p className="font-medium truncate">Connected to {syncConfig.repo}</p>
                        <p className="text-xs text-slate-400">
                          Last sync: {syncStatus.lastSyncTime ? format(syncStatus.lastSyncTime, 'MMM d, h:mm a') : 'Never'}
                        </p>
                      </div>
                    </div>
                    
                    {syncStatus.syncError && (
                      <div className="flex items-start gap-2 text-xs text-red-600 bg-red-50 p-2 rounded-lg">
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                        <p>{syncStatus.syncError}</p>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2">
                       <Button variant="secondary" onClick={handleForceSync} disabled={syncStatus.isSyncing} className="text-xs h-9">
                         {syncStatus.isSyncing ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />} Sync Now
                       </Button>
                       <Button variant="danger" onClick={handleDisconnectSync} className="text-xs h-9 bg-white border border-red-100">
                         Disconnect
                       </Button>
                    </div>
                  </div>
                )}
             </div>
           </div>

           <div>
             <h4 className="font-semibold text-slate-800 mb-2 flex items-center gap-2">
                <Download className="w-4 h-4 text-slate-500" /> Backup & Restore
             </h4>
             <p className="text-xs text-slate-500 mb-3">Manually export data to a file or import from a backup.</p>
             <div className="grid grid-cols-2 gap-3">
                <Button variant="secondary" onClick={handleExport} className="text-xs h-10">
                  Export JSON
                </Button>
                <label className="bg-slate-100 text-slate-700 hover:bg-slate-200 px-4 py-3 rounded-xl font-semibold text-xs transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer h-10">
                  <Upload className="w-4 h-4" /> Import JSON
                  <input type="file" className="hidden" accept=".json" onChange={handleImport} />
                </label>
             </div>
           </div>

           {users.length > 0 && (
             <div>
               <h4 className="font-semibold text-slate-800 mb-2">Manage Profiles</h4>
               <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                 {users.map(u => (
                   <div key={u.id} className="flex justify-between items-center bg-slate-50 p-3 rounded-lg">
                     <span className="text-sm font-medium text-slate-700">{u.name}</span>
                     <button onClick={() => handleDeleteUser(u.id)} className="text-slate-400 hover:text-red-500 p-1">
                       <Trash2 className="w-4 h-4" />
                     </button>
                   </div>
                 ))}
               </div>
             </div>
           )}
        </div>
      </Modal>
    </>
  );
};

export default App;