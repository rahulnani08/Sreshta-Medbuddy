import React, { useState, useEffect } from 'react';
import { FeverRecord, User } from '../types';
import { getFeverRecords, saveFeverRecord, deleteFeverRecord } from '../services/storageService';
import { Card, Button, Input, Modal, cn } from './Shared';
import { Plus, Thermometer, Trash2, TrendingUp, Calendar } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { format } from 'date-fns';

interface Props {
  user: User;
}

export const FeverTracker: React.FC<Props> = ({ user }) => {
  const [records, setRecords] = useState<FeverRecord[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTemp, setNewTemp] = useState('');
  const [newDate, setNewDate] = useState(format(new Date(), "yyyy-MM-dd'T'HH:mm"));
  const [newNotes, setNewNotes] = useState('');

  const loadData = () => {
    setRecords(getFeverRecords(user.id));
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.id]);

  const handleAdd = () => {
    if (!newTemp || !newDate) return;
    const record: FeverRecord = {
      id: crypto.randomUUID(),
      userId: user.id,
      temperature: parseFloat(newTemp),
      timestamp: new Date(newDate).getTime(),
      notes: newNotes
    };
    saveFeverRecord(record);
    setIsAddModalOpen(false);
    setNewTemp('');
    setNewNotes('');
    setNewDate(format(new Date(), "yyyy-MM-dd'T'HH:mm"));
    loadData();
  };

  const handleDelete = (id: string) => {
    if(window.confirm('Delete this record?')) {
      deleteFeverRecord(id);
      loadData();
    }
  };

  // Prepare chart data (reverse to show chronological left to right)
  const chartData = [...records].reverse().map(r => ({
    time: format(new Date(r.timestamp), 'MM/dd HH:mm'),
    temp: r.temperature
  }));

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <Thermometer className="w-5 h-5 text-teal-500" />
          Fever History
        </h3>
        <Button onClick={() => setIsAddModalOpen(true)} size="sm" className="py-2 px-3">
          <Plus className="w-4 h-4 mr-1" /> Log
        </Button>
      </div>

      {records.length > 0 ? (
        <Card className="p-0 overflow-hidden border-0 shadow-lg shadow-teal-900/5">
          <div className="p-4 bg-teal-50/50 border-b border-teal-100 flex justify-between items-center">
            <span className="text-sm font-semibold text-teal-800 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" /> Trend
            </span>
            <span className="text-xs text-teal-600 bg-white px-2 py-1 rounded-full border border-teal-100">
               Last: {records[0].temperature}°F
            </span>
          </div>
          <div className="h-64 w-full bg-white pt-4 pr-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="time" hide />
                <YAxis domain={['dataMin - 1', 'dataMax + 1']} hide />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  labelStyle={{ color: '#64748b', fontSize: '12px' }}
                />
                <Line
                  type="monotone"
                  dataKey="temp"
                  stroke="#0d9488"
                  strokeWidth={3}
                  dot={{ fill: '#0d9488', strokeWidth: 2, r: 4, stroke: '#fff' }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      ) : (
        <div className="text-center py-10 bg-white rounded-2xl border border-dashed border-slate-300">
          <Thermometer className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-slate-500 text-sm">No fever records yet.</p>
        </div>
      )}

      <div className="space-y-3">
        {records.map(record => (
          <Card key={record.id} className="flex justify-between items-center group">
            <div className="flex gap-4 items-center">
               <div className={cn(
                 "w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm",
                 record.temperature >= 100.4 ? "bg-red-100 text-red-700" : "bg-teal-100 text-teal-700"
               )}>
                 {record.temperature}°
               </div>
               <div>
                 <div className="text-slate-800 font-medium flex items-center gap-2">
                   {format(new Date(record.timestamp), 'EEE, MMM d')}
                   <span className="text-slate-400 text-xs font-normal">
                     {format(new Date(record.timestamp), 'h:mm a')}
                   </span>
                 </div>
                 {record.notes && <p className="text-xs text-slate-500 mt-0.5">{record.notes}</p>}
               </div>
            </div>
            <button
              onClick={() => handleDelete(record.id)}
              className="text-slate-300 hover:text-red-500 p-2 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </Card>
        ))}
      </div>

      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Log Temperature">
        <div className="space-y-4">
          <Input
            label="Date & Time"
            type="datetime-local"
            value={newDate}
            onChange={(e) => setNewDate(e.target.value)}
          />
          <Input
            label="Temperature (°F)"
            type="number"
            step="0.1"
            placeholder="98.6"
            value={newTemp}
            onChange={(e) => setNewTemp(e.target.value)}
            autoFocus
          />
          <Input
            label="Notes (Optional)"
            placeholder="e.g. Took Tylenol after this"
            value={newNotes}
            onChange={(e) => setNewNotes(e.target.value)}
          />
          <div className="pt-2">
            <Button onClick={handleAdd} className="w-full">Save Record</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};