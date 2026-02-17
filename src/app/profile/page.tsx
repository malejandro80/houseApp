"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";
import { Loader2, Mail, Shield, Phone, Edit2, Save, X, Camera, MapPin } from "lucide-react";
import { ReputationCard } from "@/components/advisor/ReputationCard";
import { toast } from "sonner"; 

interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: 'superadmin' | 'asesor' | 'usuario';
  location: string | null;
  verification_status: string;
  avatar_url: string | null;
  phone_number: string | null;
}

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [showReputation, setShowReputation] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    phone_number: ""
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    
    // 1. Get Auth User
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }
    setUser(user);

    // 2. Get Profile Data
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    
    if (profileData) {
        setProfile(profileData as any);
        setFormData({
            full_name: profileData.full_name || "",
            phone_number: profileData.phone_number || ""
        });
    }

    // 3. Check Feature Flag & Role
    if (profileData?.role === 'asesor') {
      const { data: flag } = await supabase
        .from('feature_flags')
        .select('is_enabled')
        .eq('key', 'advisor_reputation_system')
        .single();
      
      if (flag?.is_enabled) {
        setShowReputation(true);
      }
    }

    setLoading(false);
  }

  const formatPhoneNumber = (value: string) => {
    // Simple mask for +57 Colombia or generic
    // Remove non-digits
    const digits = value.replace(/\D/g, '');
    
    if (digits.length <= 2) return digits;
    if (digits.length <= 5) return `+${digits.slice(0, 2)} ${digits.slice(2)}`;
    if (digits.length <= 8) return `+${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5)}`;
    return `+${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5, 8)} ${digits.slice(8, 12)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const rawValue = e.target.value;
      // Allow user to backspace freely, but enforce format on forward type
      // For simplicity, re-format on every change if it looks like they are typing digits
      if (rawValue.length < formData.phone_number.length) {
          // Backspacing
          setFormData({ ...formData, phone_number: rawValue });
      } else {
          setFormData({ ...formData, phone_number: formatPhoneNumber(rawValue) });
      }
  };

  const handleValidation = () => {
      if (!formData.full_name.trim()) {
          toast.error("El nombre completo es requerido");
          return false;
      }
      if (formData.full_name.length < 3) {
          toast.error("El nombre debe tener al menos 3 caracteres");
          return false;
      }
      if (formData.phone_number && formData.phone_number.length < 10) {
          toast.error("El número de teléfono parece incompleto");
          return false;
      }
      return true;
  };

  const handleSave = async () => {
      if (!user) return;
      if (!handleValidation()) return;

      const { error } = await supabase
          .from('profiles')
          .update({
              full_name: formData.full_name,
              phone_number: formData.phone_number
          })
          .eq('id', user.id);

      if (error) {
          toast.error("Error al actualizar el perfil");
          console.error(error);
      } else {
          toast.success("Perfil actualizado correctamente");
          setIsEditing(false);
          loadData(); 
      }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);

      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('You must select an image to upload.');
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const filePath = `${user?.id}-${Math.random()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
         .from('avatars')
         .getPublicUrl(filePath);

      // Initialize the update object type
      const updates: {
          avatar_url: string;
          updated_at: Date;
          full_name?: string; 
          phone_number?: string;
      } = {
        avatar_url: publicUrl,
        updated_at: new Date(),
      };
      
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user?.id);

      if (error) throw error;
      
      toast.success("Foto de perfil actualizada");
      loadData();
    } catch (error) {
      toast.error('Error al subir la imagen');
      console.log(error);
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!user || !profile) {
    return (
      <div className="p-8 text-center">
        <h1 className="text-xl font-bold text-red-600">Access Denied</h1>
        <p>Please log in to view your profile.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-8">
        
        {/* Profile Header */}
        <div className="bg-white shadow rounded-2xl overflow-visible relative mt-16">
          <div className="h-40 sm:h-56 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-t-2xl"></div>
          
          <button 
            onClick={() => setIsEditing(!isEditing)}
            className="absolute top-4 right-4 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white p-2 rounded-full transition shadow-sm z-10"
          >
              {isEditing ? <X className="w-5 h-5"/> : <Edit2 className="w-5 h-5" />}
          </button>

          <div className="px-8 pb-8">
            <div className="relative flex flex-col sm:flex-row items-center sm:items-end -mt-20 sm:-mt-24 mb-6 gap-4 sm:gap-6">
              {/* Avatar Container */}
              <div className="relative group">
                  <div className="w-32 h-32 bg-white rounded-full p-1.5 shadow-xl ring-4 ring-white relative">
                    <div className="w-full h-full bg-gray-100 rounded-full flex items-center justify-center text-4xl font-bold text-gray-400 overflow-hidden relative">
                        {profile.avatar_url ? (
                            <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                            <span>{profile.full_name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase()}</span>
                        )}
                        
                        {/* Loading Overlay */}
                        {uploading && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                <Loader2 className="w-8 h-8 text-white animate-spin" />
                            </div>
                        )}
                    </div>
                    
                    {/* Camera Icon Overlay */}
                    <label 
                        className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full cursor-pointer hover:bg-blue-700 transition shadow-lg ring-2 ring-white group-hover:scale-110 z-20"
                        htmlFor="avatar-upload"
                    >
                        <Camera className="w-4 h-4" />
                        <input 
                            type="file" 
                            id="avatar-upload"
                            ref={fileInputRef}
                            className="hidden" 
                            accept="image/*"
                            onChange={handleImageUpload}
                            disabled={uploading}
                        />
                    </label>
                  </div>
              </div>

              <div className="mb-2 text-center sm:text-left flex-1 w-full sm:w-auto sm:mb-12">
                {isEditing ? (
                    <div className="mb-2 w-full max-w-md">
                        <label className="text-xs font-bold text-gray-400 sm:text-blue-200 uppercase tracking-widest mb-1 block">Nombre Completo</label>
                        <input 
                            type="text" 
                            value={formData.full_name}
                            onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                            className="text-2xl font-bold text-slate-900 sm:text-white border-b-2 border-blue-500 sm:border-white/50 focus:border-blue-600 sm:focus:border-white focus:outline-none bg-transparent px-1 w-full placeholder-blue-300"
                            placeholder="Tu Nombre"
                        />
                    </div>
                ) : (
                    <h1 className="text-3xl font-black text-slate-900 sm:text-white tracking-tight drop-shadow-sm">{profile.full_name || 'Usuario'}</h1>
                )}
                
                <div className="flex flex-wrap justify-center sm:justify-start items-center gap-2 text-sm text-gray-500 mt-2">
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider shadow-sm border
                    ${profile.role === 'superadmin' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                      profile.role === 'asesor' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                      'bg-green-50 text-green-700 border-green-200 sm:bg-white/20 sm:text-white sm:border-transparent sm:backdrop-blur-md'}`}>
                    {profile.role}
                  </span>
                  {profile.verification_status === 'verified' && (
                    <span className="flex items-center text-emerald-600 sm:text-emerald-300 gap-1 font-bold bg-emerald-50 sm:bg-emerald-900/30 px-2 py-1 rounded-lg border border-emerald-200 sm:border-emerald-500/30">
                      <Shield className="w-3 h-3 fill-current" /> Verificado
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-10 pt-6 border-t border-gray-100">
              {/* Email (Read Only) */}
              <div className="flex items-start gap-4 p-4 rounded-xl bg-gray-50/50 border border-gray-100 hover:border-blue-100 transition-colors">
                <div className="p-2.5 bg-white rounded-xl shadow-sm border border-gray-100 text-blue-600">
                    <Mail className="w-5 h-5" />
                </div>
                <div>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-0.5">Correo Electrónico</p>
                    <p className="font-medium text-slate-700">{user.email}</p>
                </div>
              </div>

              {/* Phone */}
              <div className="flex items-start gap-4 p-4 rounded-xl bg-gray-50/50 border border-gray-100 hover:border-blue-100 transition-colors relative group">
                <div className="p-2.5 bg-white rounded-xl shadow-sm border border-gray-100 text-green-600">
                    <Phone className="w-5 h-5" />
                </div>
                <div className="w-full">
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-0.5">Teléfono Móvil</p>
                    {isEditing ? (
                         <input 
                            type="text" 
                            placeholder="+57 300 000 0000"
                            value={formData.phone_number}
                            onChange={handlePhoneChange}
                            maxLength={16}
                            className="w-full font-bold text-slate-800 border-b border-gray-300 focus:outline-none focus:border-blue-600 bg-transparent py-0.5"
                        />
                    ) : (
                        <p className={`font-medium ${!profile.phone_number ? 'text-gray-400 italic' : 'text-slate-700'}`}>
                            {profile.phone_number || 'No registrado'}
                        </p>
                    )}
                </div>
              </div>
            </div>

            {isEditing && (
                <div className="mt-8 flex justify-end gap-3 pt-6 border-t border-gray-100">
                    <button 
                        onClick={() => { setIsEditing(false); setFormData({ full_name: profile.full_name, phone_number: profile.phone_number || "" }); }} 
                        className="px-5 py-2.5 text-slate-500 font-bold text-sm hover:bg-slate-50 rounded-xl transition"
                    >
                        Cancelar
                    </button>
                    <button 
                        onClick={handleSave} 
                        className="px-6 py-2.5 bg-blue-600 text-white font-bold text-sm rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-600/20 active:scale-95 transition flex items-center gap-2"
                    >
                        <Save className="w-4 h-4" /> Guardar Cambios
                    </button>
                </div>
            )}

          </div>
        </div>

        {/* Advisor Reputation Section */}
        {showReputation && (
          <ReputationCard advisorId={user.id} />
        )}

        {/* Client Stats (Placeholder/Future) */}
        {profile.role === 'usuario' && (
          <div className="bg-white shadow-sm border border-gray-100 rounded-2xl p-10 text-center">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
                <MapPin className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Propiedades Guardadas</h3>
            <p className="text-gray-500 text-sm max-w-xs mx-auto">Aún no has guardado propiedades. Explora el mapa para encontrar tu próxima inversión.</p>
          </div>
        )}

      </div>
    </div>
  );
}
