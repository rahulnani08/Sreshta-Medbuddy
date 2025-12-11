import React, { useState, useEffect } from 'react';
import { Prescription, User } from '../types';
import { getAllGlobalPrescriptions, savePrescription, deletePrescription, updatePrescription } from '../services/storageService';
import { Card, Button, Input, Modal, cn } from './Shared';
import { Plus, Pill, Trash2, Search } from 'lucide-react';

interface Props {
  users: User[];
}

export const PrescriptionList: React.FC<Props> = ({ users }) => {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [filteredPrescriptions, setFilteredPrescriptions] = useState<Prescription[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  // Form State
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [illness, setIllness] = useState('');
  const [medicineName, setMedicineName] = useState('');
  const [dosage, setDosage] = useState('');
  const [prescribedBy, setPrescribedBy] = useState('');
  
  const loadData = () => {
    // Load ALL prescriptions
    const all = getAllGlobalPrescriptions();
    // Sort by newest
    all.sort((a, b) => b.timestamp - a.timestamp);
    setPrescriptions(all);
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter effect
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredPrescriptions(prescriptions);
      return;
    }

    const lowerQuery = searchQuery.toLowerCase();
    const filtered = prescriptions.filter(p => {
      const user = users.find(u => u.id === p.userId);
      const userName = user?.name.toLowerCase() || '';
      const userType = user?.type.toLowerCase() || '';
      
      return (
        p.medicineName.toLowerCase().includes(lowerQuery) ||
        p.illness.toLowerCase().includes(lowerQuery) ||
        p.prescribedBy.toLowerCase().includes(lowerQuery) ||
        userName.includes(lowerQuery) ||
        userType.includes(lowerQuery)
      );
    });
    setFilteredPrescriptions(filtered);
  }, [searchQuery, prescriptions, users]);

  const resetForm = () => {
    setIllness('');
    setMedicineName('');
    setDosage('');
    setPrescribedBy('');
    setSelectedUserId(users.length > 0 ? users[0].id : '');
  };

  const openAddModal = () => {
    resetForm();
    setIsAddModalOpen(true);
  };

  const handleAdd = () => {
    if (!medicineName || !selectedUserId) return;
    const p: Prescription = {
      id: crypto.randomUUID(),
      userId: selectedUserId,
      illness: illness || 'General',
      medicineName,
      dosage,
      prescribedBy,
      isActive: true,
      timestamp: Date.now()
    };
    savePrescription(p);
    setIsAddModalOpen(false);
    resetForm();
    loadData();
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if(window.confirm('Remove this prescription?')) {
      deletePrescription(id);
      loadData();
    }
  };

  const toggleStatus = (p: Prescription) => {
    updatePrescription({ ...p, isActive: !p.isActive });
    loadData();
  };

  const getUserDetails = (userId: string) => {
    return users.find(u => u.id === userId);
  };

  return (
    <div className="space-y-6 pb-24">
      {/* Search Bar */}
      <div className="sticky top-0 bg-slate-50 z-10 py-2">
        <div className="relative">
            <Search className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search medicines, illness, user..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 bg-white shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
            />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-slate-800">
          All Medications ({filteredPrescriptions.length})
        </h3>
        <Button onClick={openAddModal} size="sm" className="py-2 px-3 bg-blue-600 hover:bg-blue-700 shadow-blue-600/20">
          <Plus className="w-4 h-4 mr-1" /> Add New
        </Button>
      </div>

      {filteredPrescriptions.length === 0 && (
         <div className="text-center py-10 bg-white rounded-2xl border border-dashed border-slate-300">
           <Pill className="w-10 h-10 text-slate-300 mx-auto mb-2" />
           <p className="text-slate-500 text-sm">{searchQuery ? 'No matching medicines found.' : 'No prescriptions recorded.'}</p>
         </div>
      )}

      <div className="space-y-4">
        {filteredPrescriptions.map(p => {
          const user = getUserDetails(p.userId);
          return (
            <Card key={p.id} className={cn("relative overflow-hidden border-l-4", p.isActive ? "border-l-blue-500" : "border-l-slate-300 bg-slate-50")}>
              
              {/* User Badge */}
              <div className="flex items-center gap-2 mb-3 pb-3 border-b border-slate-100">
                 <div className={cn("w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white", 
                    user?.type === 'Kid' ? "bg-gradient-to-br from-pink-400 to-orange-400" : "bg-gradient-to-br from-blue-400 to-teal-400")}>
                    {user?.name.charAt(0).toUpperCase()}
                 </div>
                 <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                    {user ? `${user.name} (${user.type})` : 'Unknown User'}
                 </span>
              </div>

              <div className="flex justify-between items-start mb-2">
                 <div>
                   <h4 className={cn("font-bold text-lg leading-tight", !p.isActive && "text-slate-500")}>{p.medicineName}</h4>
                   <p className="text-sm text-slate-500 font-medium">{p.illness}</p>
                 </div>
                 <button onClick={() => toggleStatus(p)} className={cn("text-xs font-bold px-2 py-1 rounded uppercase tracking-wide shrink-0 ml-2", p.isActive ? "bg-green-100 text-green-700" : "bg-slate-200 text-slate-600")}>
                   {p.isActive ? "Active" : "Done"}
                 </button>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm text-slate-600 mt-3 bg-slate-50/50 p-3 rounded-lg">
                <div>
                  <span className="block text-xs text-slate-400 uppercase">Dosage</span>
                  {p.dosage || 'N/A'}
                </div>
                <div>
                  <span className="block text-xs text-slate-400 uppercase">Doctor</span>
                  {p.prescribedBy || 'N/A'}
                </div>
              </div>

              <div className="absolute bottom-2 right-2">
                 <button onClick={(e) => handleDelete(p.id, e)} className="p-2 text-slate-300 hover:text-red-500">
                   <Trash2 className="w-4 h-4" />
                 </button>
              </div>
            </Card>
          );
        })}
      </div>

      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Add Prescription">
        <div className="space-y-4">
          <div className="flex flex-col gap-1.5 w-full">
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">For Patient</label>
            <select 
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
            >
              <option value="" disabled>Select User</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>{u.name} ({u.type})</option>
              ))}
            </select>
          </div>

          <Input label="Medicine Name" value={medicineName} onChange={e => setMedicineName(e.target.value)} placeholder="e.g. Amoxicillin" />
          <Input label="Dosage" value={dosage} onChange={e => setDosage(e.target.value)} placeholder="e.g. 500mg, 2x daily" />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Illness" value={illness} onChange={e => setIllness(e.target.value)} placeholder="e.g. Flu" />
            <Input label="Prescribed By" value={prescribedBy} onChange={e => setPrescribedBy(e.target.value)} placeholder="Dr. Smith" />
          </div>
          
          <div className="pt-2">
            <Button onClick={handleAdd} className="w-full bg-blue-600 hover:bg-blue-700">Save Prescription</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};