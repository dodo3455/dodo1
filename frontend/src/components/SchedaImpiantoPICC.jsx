import { useState, useRef, useEffect } from "react";
import { apiClient } from "@/App";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { 
  Plus, FileText, Edit2, Trash2, Save, Printer, Download, 
  RotateCw, RotateCcw, ZoomIn, ZoomOut, X, Upload, Image as ImageIcon,
  Maximize2, FileCheck, FileEdit
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { it } from "date-fns/locale";

// Opzioni per i tipi di catetere
const TIPO_CATETERE_OPTIONS = [
  { id: "cvc_non_tunnellizzato", label: "CVC non tunnellizzato (breve termine)" },
  { id: "cvc_tunnellizzato", label: "CVC tunnellizzato (lungo termine tipo Groshong, Hickman, Broviac)" },
  { id: "picc", label: "CVC medio termine (PICC)" },
  { id: "port", label: "PORT (lungo termine)" },
  { id: "midline", label: "Midline" },
];

// Opzioni semplificate
const TIPO_IMPIANTO_SEMPLICE = [
  { id: "picc", label: "PICC" },
  { id: "picc_port", label: "PICC Port" },
  { id: "midline", label: "Midline" },
];

// Opzioni posizionamento CVC
const POSIZIONAMENTO_CVC_OPTIONS = [
  { id: "succlavia_dx", label: "succlavia dx" },
  { id: "succlavia_sn", label: "succlavia sn" },
  { id: "giugulare_dx", label: "giugulare interna dx" },
  { id: "giugulare_sn", label: "giugulare interna sn" },
  { id: "altro", label: "altro" },
];

// Opzioni vena PICC
const VENA_OPTIONS = [
  { id: "basilica", label: "Basilica" },
  { id: "cefalica", label: "Cefalica" },
  { id: "brachiale", label: "Brachiale" },
];

// Opzioni disinfezione
const DISINFEZIONE_OPTIONS = [
  { id: "clorexidina_2", label: "CLOREXIDINA IN SOLUZIONE ALCOLICA 2%" },
  { id: "iodiopovidone", label: "IODIOPOVIDONE" },
];

// Opzioni motivazione
const MOTIVAZIONE_OPTIONS = [
  { id: "chemioterapia", label: "Chemioterapia" },
  { id: "difficolta_vene", label: "Difficoltà nel reperire vene" },
  { id: "terapia_prolungata", label: "Terapia prolungata" },
  { id: "monitoraggio", label: "Monitoraggio invasivo" },
  { id: "altro", label: "Altro" },
];

// Componente per visualizzare foto con rotazione adattiva
const PhotoViewer = ({ photo, onDelete, onCrop }) => {
  const [rotation, setRotation] = useState(0);
  const [showFullscreen, setShowFullscreen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const containerRef = useRef(null);
  const [containerSize, setContainerSize] = useState({ width: 150, height: 150 });

  // Calcola le dimensioni ottimali per contenere l'immagine ruotata
  useEffect(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setContainerSize({ width: rect.width, height: rect.height });
    }
  }, [rotation]);

  const handleRotate = (direction) => {
    setRotation(prev => (prev + (direction === 'cw' ? 90 : -90)) % 360);
  };

  const imageSrc = photo.image_data?.startsWith('data:') 
    ? photo.image_data 
    : `data:image/jpeg;base64,${photo.image_data}`;

  // Calcola la scala per adattare l'immagine ruotata al container
  const isRotated90or270 = Math.abs(rotation % 180) === 90;
  const scaleFactor = isRotated90or270 ? 0.7 : 1;

  return (
    <>
      <div className="relative group border rounded-lg overflow-hidden bg-gray-100">
        <div 
          ref={containerRef}
          className="relative flex items-center justify-center"
          style={{ 
            width: '100%',
            height: '150px',
            overflow: 'hidden'
          }}
        >
          <img
            src={imageSrc}
            alt={photo.descrizione || 'Allegato'}
            className="cursor-pointer transition-transform duration-300"
            style={{
              transform: `rotate(${rotation}deg) scale(${scaleFactor})`,
              maxWidth: isRotated90or270 ? '150px' : '100%',
              maxHeight: isRotated90or270 ? '100%' : '150px',
              objectFit: 'contain',
            }}
            onClick={() => setShowFullscreen(true)}
          />
        </div>

        {/* Toolbar overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-black/70 p-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="flex items-center justify-center gap-1">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6 text-white hover:bg-white/20"
              onClick={(e) => { e.stopPropagation(); handleRotate('ccw'); }}
              title="Ruota sinistra"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6 text-white hover:bg-white/20"
              onClick={(e) => { e.stopPropagation(); handleRotate('cw'); }}
              title="Ruota destra"
            >
              <RotateCw className="h-3.5 w-3.5" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6 text-white hover:bg-white/20"
              onClick={(e) => { e.stopPropagation(); setShowFullscreen(true); }}
              title="Ingrandisci"
            >
              <Maximize2 className="h-3.5 w-3.5" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6 text-red-400 hover:bg-red-500/20"
              onClick={(e) => { e.stopPropagation(); onDelete(photo.id || photo.tempId); }}
              title="Elimina"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {photo.descrizione && (
          <div className="absolute top-1 left-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded max-w-[90%] truncate">
            {photo.descrizione}
          </div>
        )}
      </div>

      {/* Fullscreen Modal */}
      <Dialog open={showFullscreen} onOpenChange={setShowFullscreen}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] p-2">
          <div className="relative flex flex-col h-full">
            <div className="flex items-center justify-between p-2 border-b">
              <span className="text-sm font-medium">{photo.descrizione || 'Visualizza foto'}</span>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => handleRotate('ccw')}>
                  <RotateCcw className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleRotate('cw')}>
                  <RotateCw className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => setZoom(z => Math.min(3, z + 0.2))}>
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => setZoom(z => Math.max(0.3, z - 0.2))}>
                  <ZoomOut className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div 
              className="flex-1 flex items-center justify-center overflow-auto p-4 bg-gray-900"
              style={{ minHeight: '70vh' }}
            >
              <img
                src={imageSrc}
                alt={photo.descrizione || 'Allegato'}
                style={{
                  transform: `rotate(${rotation}deg) scale(${zoom})`,
                  transition: 'transform 0.3s ease',
                  maxWidth: isRotated90or270 ? '70vh' : '90vw',
                  maxHeight: isRotated90or270 ? '90vw' : '70vh',
                  objectFit: 'contain'
                }}
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

// Form iniziale vuoto per scheda completa
const getEmptyFormData = () => ({
  scheda_type: "semplificata", // semplificata o completa
  // Header
  presidio_ospedaliero: "",
  codice: "",
  unita_operativa: "",
  data_presa_carico: format(new Date(), "yyyy-MM-dd"),
  cartella_clinica: "",
  // Sezione Catetere Già Presente
  catetere_presente: false,
  catetere_presente_tipo: "",
  catetere_presente_struttura: "",
  catetere_presente_data: "",
  catetere_presente_ora: "",
  catetere_presente_modalita: "",
  catetere_presente_rx: null,
  catetere_da_sostituire: null,
  // Sezione Impianto Catetere
  tipo_catetere: "",
  posizionamento_cvc: "",
  posizionamento_cvc_altro: "",
  braccio: "",
  vena: "",
  exit_site_cm: "",
  tunnelizzazione: false,
  tunnelizzazione_note: "",
  valutazione_sito: null,
  ecoguidato: null,
  igiene_mani: null,
  precauzioni_barriera: null,
  disinfezione: [],
  sutureless_device: null,
  medicazione_trasparente: null,
  medicazione_occlusiva: null,
  controllo_rx: null,
  controllo_ecg: null,
  modalita: "",
  motivazione: [],
  motivazione_altro: "",
  data_posizionamento: format(new Date(), "yyyy-MM-dd"),
  operatore: "",
  allegati: [],
  // Legacy
  data_impianto: format(new Date(), "yyyy-MM-dd"),
});

export const SchedaImpiantoPICC = ({ patientId, ambulatorio, schede, onRefresh, patient }) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedScheda, setSelectedScheda] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState(getEmptyFormData());
  const [uploadedPhotos, setUploadedPhotos] = useState([]);
  const [selectTypeOpen, setSelectTypeOpen] = useState(false);
  const fileInputRef = useRef(null);

  const resetForm = () => {
    setFormData(getEmptyFormData());
    setUploadedPhotos([]);
  };

  const openNewScheda = (type) => {
    resetForm();
    setFormData(prev => ({ ...prev, scheda_type: type }));
    setSelectTypeOpen(false);
    setDialogOpen(true);
  };

  const handleCreate = async () => {
    setSaving(true);
    try {
      await apiClient.post("/schede-impianto-picc", {
        patient_id: patientId,
        ambulatorio,
        ...formData,
        data_impianto: formData.data_posizionamento,
        allegati: uploadedPhotos.map(p => p.id || p.tempId)
      });
      toast.success("Scheda impianto creata");
      setDialogOpen(false);
      resetForm();
      onRefresh();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Errore durante il salvataggio");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedScheda) return;
    setSaving(true);
    try {
      await apiClient.put(`/schede-impianto-picc/${selectedScheda.id}`, {
        ...formData,
        data_impianto: formData.data_posizionamento,
        allegati: uploadedPhotos.map(p => p.id || p.tempId)
      });
      toast.success("Scheda aggiornata");
      setEditDialogOpen(false);
      setIsEditing(false);
      onRefresh();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Errore durante l'aggiornamento");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedScheda) return;
    try {
      await apiClient.delete(`/schede-impianto-picc/${selectedScheda.id}`);
      toast.success("Scheda eliminata");
      setDeleteDialogOpen(false);
      setSelectedScheda(null);
      onRefresh();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Errore durante l'eliminazione");
    }
  };

  const openEditDialog = (scheda) => {
    setSelectedScheda(scheda);
    setFormData({
      ...getEmptyFormData(),
      ...scheda,
      data_posizionamento: scheda.data_posizionamento || scheda.data_impianto || format(new Date(), "yyyy-MM-dd")
    });
    setUploadedPhotos(scheda.allegati_data || []);
    setIsEditing(false);
    setEditDialogOpen(true);
  };

  const handlePhotoUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (const file of files) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target.result.split(',')[1];
        const newPhoto = {
          tempId: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          image_data: base64,
          descrizione: file.name,
          data: format(new Date(), "yyyy-MM-dd")
        };
        setUploadedPhotos(prev => [...prev, newPhoto]);
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  const handleDeletePhoto = (photoId) => {
    setUploadedPhotos(prev => prev.filter(p => (p.id || p.tempId) !== photoId));
  };

  // Genera PDF (solo per scheda completa)
  const handleDownloadPDF = async (scheda) => {
    if (scheda.scheda_type === 'semplificata') {
      toast.error("Il PDF è disponibile solo per la scheda completa");
      return;
    }
    try {
      const response = await apiClient.get(`/schede-impianto-picc/${scheda.id}/pdf`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `scheda_impianto_${scheda.data_posizionamento || scheda.data_impianto || 'nd'}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success("PDF scaricato");
    } catch (error) {
      toast.error("Errore nel download del PDF");
    }
  };

  // Toggle array value
  const toggleArrayValue = (field, value) => {
    setFormData(prev => {
      const arr = prev[field] || [];
      if (arr.includes(value)) {
        return { ...prev, [field]: arr.filter(v => v !== value) };
      }
      return { ...prev, [field]: [...arr, value] };
    });
  };

  // ========== FORM SEMPLIFICATO ==========
  const renderSimplifiedForm = (data, readOnly = false) => (
    <div className="space-y-6 p-4">
      <div className="text-center mb-4">
        <h3 className="text-lg font-bold">Scheda Impianto Semplificata</h3>
        <p className="text-sm text-gray-500">Per statistiche rapide</p>
      </div>

      {/* Tipo di Impianto */}
      <div className="space-y-3">
        <Label className="font-semibold">Tipo di Impianto *</Label>
        <div className="grid grid-cols-3 gap-3">
          {TIPO_IMPIANTO_SEMPLICE.map(opt => (
            <div 
              key={opt.id} 
              className={`p-3 border-2 rounded-lg cursor-pointer text-center transition-all ${
                data.tipo_catetere === opt.id 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 hover:border-gray-300'
              } ${readOnly ? 'cursor-default' : ''}`}
              onClick={() => !readOnly && setFormData(p => ({...p, tipo_catetere: opt.id}))}
            >
              <span className="font-medium">{opt.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Braccio e Vena */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="font-semibold">Braccio *</Label>
          <div className="flex gap-3">
            <div 
              className={`flex-1 p-3 border-2 rounded-lg cursor-pointer text-center ${
                data.braccio === 'dx' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
              } ${readOnly ? 'cursor-default' : ''}`}
              onClick={() => !readOnly && setFormData(p => ({...p, braccio: 'dx'}))}
            >
              Destro
            </div>
            <div 
              className={`flex-1 p-3 border-2 rounded-lg cursor-pointer text-center ${
                data.braccio === 'sn' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
              } ${readOnly ? 'cursor-default' : ''}`}
              onClick={() => !readOnly && setFormData(p => ({...p, braccio: 'sn'}))}
            >
              Sinistro
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="font-semibold">Vena *</Label>
          <div className="flex gap-2">
            {VENA_OPTIONS.map(opt => (
              <div 
                key={opt.id}
                className={`flex-1 p-3 border-2 rounded-lg cursor-pointer text-center text-sm ${
                  data.vena === opt.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                } ${readOnly ? 'cursor-default' : ''}`}
                onClick={() => !readOnly && setFormData(p => ({...p, vena: opt.id}))}
              >
                {opt.label}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Exit Site */}
      <div className="space-y-2">
        <Label className="font-semibold">Exit-site (cm)</Label>
        <Input 
          value={data.exit_site_cm || ''} 
          onChange={e => setFormData(p => ({...p, exit_site_cm: e.target.value}))}
          disabled={readOnly}
          placeholder="es. 35"
          className="max-w-32"
        />
      </div>

      {/* Tunnelizzazione */}
      <div className="space-y-2">
        <div className="flex items-center gap-4">
          <Label className="font-semibold">Tunnelizzazione</Label>
          <div className="flex items-center gap-2">
            <Checkbox 
              checked={data.tunnelizzazione === true}
              onCheckedChange={(checked) => !readOnly && setFormData(p => ({
                ...p, 
                tunnelizzazione: checked,
                tunnelizzazione_note: checked ? p.tunnelizzazione_note : ''
              }))}
              disabled={readOnly}
            />
            <span>Sì</span>
          </div>
        </div>
        {data.tunnelizzazione && (
          <div className="ml-6">
            <Label className="text-sm text-gray-600">Note (max 6 caratteri)</Label>
            <Input 
              value={data.tunnelizzazione_note || ''} 
              onChange={e => setFormData(p => ({
                ...p, 
                tunnelizzazione_note: e.target.value.slice(0, 6)
              }))}
              disabled={readOnly}
              maxLength={6}
              placeholder="es. 3cm"
              className="max-w-24"
            />
          </div>
        )}
      </div>

      {/* Motivazione */}
      <div className="space-y-2">
        <Label className="font-semibold">Motivazione Impianto</Label>
        <div className="flex flex-wrap gap-2">
          {MOTIVAZIONE_OPTIONS.map(opt => (
            <div 
              key={opt.id}
              className={`px-3 py-2 border-2 rounded-lg cursor-pointer text-sm ${
                (data.motivazione || []).includes(opt.id) ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
              } ${readOnly ? 'cursor-default' : ''}`}
              onClick={() => !readOnly && toggleArrayValue('motivazione', opt.id)}
            >
              {opt.label}
            </div>
          ))}
        </div>
        {(data.motivazione || []).includes('altro') && (
          <Input 
            value={data.motivazione_altro || ''} 
            onChange={e => setFormData(p => ({...p, motivazione_altro: e.target.value}))}
            disabled={readOnly}
            placeholder="Specificare..."
            className="mt-2"
          />
        )}
      </div>

      {/* Operatore */}
      <div className="space-y-2">
        <Label className="font-semibold">Operatore che ha impiantato *</Label>
        <Input 
          value={data.operatore || ''} 
          onChange={e => setFormData(p => ({...p, operatore: e.target.value}))}
          disabled={readOnly}
          placeholder="Nome e Cognome"
        />
      </div>

      {/* Data Impianto */}
      <div className="space-y-2">
        <Label className="font-semibold">Data Impianto *</Label>
        <Input 
          type="date"
          value={data.data_posizionamento || ''} 
          onChange={e => setFormData(p => ({...p, data_posizionamento: e.target.value}))}
          disabled={readOnly}
          className="max-w-48"
        />
      </div>

      {/* Allegati */}
      {!readOnly && (
        <div className="space-y-3 pt-4 border-t">
          <div className="flex items-center justify-between">
            <Label className="font-semibold">Allegati / Foto</Label>
            <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
              <Upload className="h-4 w-4 mr-2" /> Carica
            </Button>
            <input 
              ref={fileInputRef}
              type="file" 
              accept="image/*" 
              multiple 
              onChange={handlePhotoUpload}
              className="hidden"
            />
          </div>
          
          {uploadedPhotos.length > 0 ? (
            <div className="grid grid-cols-3 gap-3">
              {uploadedPhotos.map((photo) => (
                <PhotoViewer 
                  key={photo.id || photo.tempId}
                  photo={photo}
                  onDelete={handleDeletePhoto}
                />
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-400 py-4 border border-dashed rounded-lg text-sm">
              Nessun allegato
            </div>
          )}
        </div>
      )}
    </div>
  );

  // ========== FORM COMPLETO ==========
  const renderFullForm = (data, readOnly = false) => (
    <div className="space-y-4 text-sm">
      {/* HEADER */}
      <div className="border-2 border-gray-300 p-3 bg-gray-50">
        <div className="text-center font-bold text-base mb-2">
          SCHEDA IMPIANTO e GESTIONE ACCESSI VENOSI
        </div>
        <div className="text-right text-xs text-gray-500 -mt-6 mb-2">Allegato n. 2</div>
        
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="space-y-1">
            <div className="flex items-center gap-1">
              <Label className="whitespace-nowrap text-xs">Presidio Ospedaliero:</Label>
              <Input 
                value={data.presidio_ospedaliero || ''} 
                onChange={e => setFormData(p => ({...p, presidio_ospedaliero: e.target.value}))}
                disabled={readOnly}
                className="h-7 text-xs"
              />
            </div>
            <div className="flex items-center gap-1">
              <Label className="text-xs">Codice:</Label>
              <Input value={data.codice || ''} onChange={e => setFormData(p => ({...p, codice: e.target.value}))} disabled={readOnly} className="h-7 text-xs w-16" />
              <Label className="text-xs ml-2">U.O.:</Label>
              <Input value={data.unita_operativa || ''} onChange={e => setFormData(p => ({...p, unita_operativa: e.target.value}))} disabled={readOnly} className="h-7 text-xs flex-1" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-1">
              <Label className="text-xs whitespace-nowrap">Preso in carico dal:</Label>
              <Input type="date" value={data.data_presa_carico || ''} onChange={e => setFormData(p => ({...p, data_presa_carico: e.target.value}))} disabled={readOnly} className="h-7 text-xs w-32" />
            </div>
            <div className="flex items-center gap-1">
              <Label className="text-xs">Cartella Clinica n.:</Label>
              <Input value={data.cartella_clinica || ''} onChange={e => setFormData(p => ({...p, cartella_clinica: e.target.value}))} disabled={readOnly} className="h-7 text-xs flex-1" />
            </div>
          </div>
        </div>

        <div className="mt-2 pt-2 border-t flex items-center gap-4 text-xs">
          <span><b>Paziente:</b> {patient?.cognome} {patient?.nome}</span>
          <span><b>Nato:</b> {patient?.data_nascita || '-'}</span>
          <span className="flex items-center gap-1"><b>Sesso:</b> 
            <Checkbox checked={patient?.sesso === 'M'} disabled className="h-3 w-3" /> M
            <Checkbox checked={patient?.sesso === 'F'} disabled className="h-3 w-3" /> F
          </span>
        </div>
      </div>

      {/* SEZIONE CATETERE GIÀ PRESENTE */}
      <div className="border-2 border-gray-300">
        <div className="bg-gray-200 px-3 py-1 font-bold text-center text-xs">
          SEZIONE CATETERE GIÀ PRESENTE
        </div>
        <div className="p-2 space-y-2 text-xs">
          <p className="text-[10px] italic text-gray-500">Da compilare se catetere già presente al momento della presa in carico</p>

          <div className="space-y-1">
            <Label className="font-semibold text-xs">Tipo di Catetere:</Label>
            <div className="grid grid-cols-2 gap-1">
              {TIPO_CATETERE_OPTIONS.map(opt => (
                <div key={opt.id} className="flex items-center gap-1">
                  <Checkbox checked={data.catetere_presente_tipo === opt.id} onCheckedChange={(c) => !readOnly && setFormData(p => ({...p, catetere_presente_tipo: c ? opt.id : ''}))} disabled={readOnly} className="h-3 w-3" />
                  <span className="text-[11px]">{opt.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Label className="text-xs">Struttura/reparto:</Label>
            <Input value={data.catetere_presente_struttura || ''} onChange={e => setFormData(p => ({...p, catetere_presente_struttura: e.target.value}))} disabled={readOnly} className="h-6 text-xs w-40" />
            <Label className="text-xs">data:</Label>
            <Input type="date" value={data.catetere_presente_data || ''} onChange={e => setFormData(p => ({...p, catetere_presente_data: e.target.value}))} disabled={readOnly} className="h-6 text-xs w-28" />
            <Label className="text-xs">ora:</Label>
            <Input type="time" value={data.catetere_presente_ora || ''} onChange={e => setFormData(p => ({...p, catetere_presente_ora: e.target.value}))} disabled={readOnly} className="h-6 text-xs w-20" />
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span>modalità:</span>
            <Checkbox checked={data.catetere_presente_modalita === 'emergenza_urgenza'} onCheckedChange={(c) => !readOnly && setFormData(p => ({...p, catetere_presente_modalita: c ? 'emergenza_urgenza' : ''}))} disabled={readOnly} className="h-3 w-3" />
            <span>emergenza/urgenza</span>
            <Checkbox checked={data.catetere_presente_modalita === 'programmato_elezione'} onCheckedChange={(c) => !readOnly && setFormData(p => ({...p, catetere_presente_modalita: c ? 'programmato_elezione' : ''}))} disabled={readOnly} className="h-3 w-3" />
            <span>programmato/elezione</span>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span>Controllo RX Post-Inserimento:</span>
            <Checkbox checked={data.catetere_presente_rx === true} onCheckedChange={(c) => !readOnly && setFormData(p => ({...p, catetere_presente_rx: c ? true : null}))} disabled={readOnly} className="h-3 w-3" /><span>SI</span>
            <Checkbox checked={data.catetere_presente_rx === false} onCheckedChange={(c) => !readOnly && setFormData(p => ({...p, catetere_presente_rx: c ? false : null}))} disabled={readOnly} className="h-3 w-3" /><span>NO</span>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span>Catetere da sostituire:</span>
            <Checkbox checked={data.catetere_da_sostituire === true} onCheckedChange={(c) => !readOnly && setFormData(p => ({...p, catetere_da_sostituire: c ? true : null}))} disabled={readOnly} className="h-3 w-3" /><span>SI</span>
            <Checkbox checked={data.catetere_da_sostituire === false} onCheckedChange={(c) => !readOnly && setFormData(p => ({...p, catetere_da_sostituire: c ? false : null}))} disabled={readOnly} className="h-3 w-3" /><span>NO</span>
            <span className="text-[10px] text-gray-500">se si compilare la SEZIONE IMPIANTO</span>
          </div>
        </div>
      </div>

      {/* SEZIONE IMPIANTO CATETERE */}
      <div className="border-2 border-gray-300">
        <div className="bg-gray-200 px-3 py-1 font-bold text-center text-xs">
          SEZIONE IMPIANTO CATETERE
        </div>
        <div className="p-2 space-y-2 text-xs">
          <p className="text-[10px] italic text-gray-500">Da compilare se catetere viene impiantato nella struttura</p>

          {/* TIPO DI CATETERE */}
          <div className="space-y-1">
            <Label className="font-semibold text-xs">TIPO DI CATETERE:</Label>
            <div className="grid grid-cols-2 gap-1">
              {TIPO_CATETERE_OPTIONS.map(opt => (
                <div key={opt.id} className="flex items-center gap-1">
                  <Checkbox checked={data.tipo_catetere === opt.id} onCheckedChange={(c) => !readOnly && setFormData(p => ({...p, tipo_catetere: c ? opt.id : ''}))} disabled={readOnly} className="h-3 w-3" />
                  <span className="text-[11px]">{opt.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* POSIZIONAMENTO CVC */}
          <div className="flex items-center gap-2 flex-wrap">
            <Label className="font-semibold text-xs">POSIZIONAMENTO CVC:</Label>
            {POSIZIONAMENTO_CVC_OPTIONS.map(opt => (
              <span key={opt.id} className="flex items-center gap-0.5">
                <Checkbox checked={data.posizionamento_cvc === opt.id} onCheckedChange={(c) => !readOnly && setFormData(p => ({...p, posizionamento_cvc: c ? opt.id : ''}))} disabled={readOnly} className="h-3 w-3" />
                <span className="text-[11px]">{opt.label}</span>
              </span>
            ))}
            {data.posizionamento_cvc === 'altro' && (
              <Input value={data.posizionamento_cvc_altro || ''} onChange={e => setFormData(p => ({...p, posizionamento_cvc_altro: e.target.value}))} disabled={readOnly} className="h-6 text-xs w-24" placeholder="specificare" />
            )}
          </div>

          {/* POSIZIONAMENTO PICC */}
          <div className="flex items-center gap-2 flex-wrap">
            <Label className="font-semibold text-xs">POSIZIONAMENTO PICC:</Label>
            <Checkbox checked={data.braccio === 'dx'} onCheckedChange={(c) => !readOnly && setFormData(p => ({...p, braccio: c ? 'dx' : ''}))} disabled={readOnly} className="h-3 w-3" /><span className="text-[11px]">braccio dx</span>
            <Checkbox checked={data.braccio === 'sn'} onCheckedChange={(c) => !readOnly && setFormData(p => ({...p, braccio: c ? 'sn' : ''}))} disabled={readOnly} className="h-3 w-3" /><span className="text-[11px]">braccio sn</span>
            <span className="font-semibold ml-2">Vena:</span>
            {VENA_OPTIONS.map(opt => (
              <span key={opt.id} className="flex items-center gap-0.5">
                <Checkbox checked={data.vena === opt.id} onCheckedChange={(c) => !readOnly && setFormData(p => ({...p, vena: c ? opt.id : ''}))} disabled={readOnly} className="h-3 w-3" />
                <span className="text-[11px]">{opt.label}</span>
              </span>
            ))}
            <span className="ml-2">Exit-site cm:</span>
            <Input value={data.exit_site_cm || ''} onChange={e => setFormData(p => ({...p, exit_site_cm: e.target.value}))} disabled={readOnly} className="h-6 text-xs w-12" />
          </div>

          {/* PROCEDURE */}
          <div className="space-y-1">
            {[
              { key: 'valutazione_sito', label: 'VALUTAZIONE MIGLIOR SITO DI INSERIMENTO' },
              { key: 'ecoguidato', label: 'IMPIANTO ECOGUIDATO' },
              { key: 'igiene_mani', label: 'IGIENE DELLE MANI (LAVAGGIO ANTISETTICO O FRIZIONE ALCOLICA)' },
              { key: 'precauzioni_barriera', label: 'UTILIZZO MASSIME PRECAUZIONI DI BARRIERA' },
            ].map(item => (
              <div key={item.key} className="flex items-center gap-2">
                <span className="text-[11px] min-w-[280px]"><b>{item.label}:</b></span>
                <Checkbox checked={data[item.key] === true} onCheckedChange={(c) => !readOnly && setFormData(p => ({...p, [item.key]: c ? true : null}))} disabled={readOnly} className="h-3 w-3" /><span className="text-[11px]">SI</span>
                <Checkbox checked={data[item.key] === false} onCheckedChange={(c) => !readOnly && setFormData(p => ({...p, [item.key]: c ? false : null}))} disabled={readOnly} className="h-3 w-3" /><span className="text-[11px]">NO</span>
              </div>
            ))}
          </div>

          {/* DISINFEZIONE */}
          <div className="flex items-center gap-2 flex-wrap">
            <Label className="font-semibold text-xs">DISINFEZIONE CUTE INTEGRA:</Label>
            {DISINFEZIONE_OPTIONS.map(opt => (
              <span key={opt.id} className="flex items-center gap-0.5">
                <Checkbox checked={(data.disinfezione || []).includes(opt.id)} onCheckedChange={() => !readOnly && toggleArrayValue('disinfezione', opt.id)} disabled={readOnly} className="h-3 w-3" />
                <span className="text-[10px]">{opt.label}</span>
              </span>
            ))}
          </div>

          {/* DISPOSITIVI */}
          <div className="space-y-1">
            {[
              { key: 'sutureless_device', label: 'IMPIEGO DI "SUTURELESS DEVICES" PER IL FISSAGGIO' },
              { key: 'medicazione_trasparente', label: 'IMPIEGO DI MEDICAZIONE SEMIPERMEABILE TRASPARENTE' },
              { key: 'medicazione_occlusiva', label: 'IMPIEGO DI MEDICAZIONE OCCLUSIVA' },
              { key: 'controllo_rx', label: 'CONTROLLO RX POST-INSERIMENTO' },
              { key: 'controllo_ecg', label: 'CONTROLLO ECG POST INSERIMENTO' },
            ].map(item => (
              <div key={item.key} className="flex items-center gap-2">
                <span className="text-[11px] min-w-[280px]"><b>{item.label}:</b></span>
                <Checkbox checked={data[item.key] === true} onCheckedChange={(c) => !readOnly && setFormData(p => ({...p, [item.key]: c ? true : null}))} disabled={readOnly} className="h-3 w-3" /><span className="text-[11px]">SI</span>
                <Checkbox checked={data[item.key] === false} onCheckedChange={(c) => !readOnly && setFormData(p => ({...p, [item.key]: c ? false : null}))} disabled={readOnly} className="h-3 w-3" /><span className="text-[11px]">NO</span>
              </div>
            ))}
          </div>

          {/* MODALITÀ */}
          <div className="flex items-center gap-3">
            <Label className="font-semibold text-xs">MODALITÀ:</Label>
            {['emergenza', 'urgenza', 'elezione'].map(m => (
              <span key={m} className="flex items-center gap-0.5">
                <Checkbox checked={data.modalita === m} onCheckedChange={(c) => !readOnly && setFormData(p => ({...p, modalita: c ? m : ''}))} disabled={readOnly} className="h-3 w-3" />
                <span className="text-[11px] uppercase">{m}</span>
              </span>
            ))}
          </div>

          {/* MOTIVAZIONE */}
          <div className="flex items-center gap-2 flex-wrap">
            <Label className="font-semibold text-xs">MOTIVAZIONE INSERIMENTO CVC:</Label>
            {MOTIVAZIONE_OPTIONS.map(opt => (
              <span key={opt.id} className="flex items-center gap-0.5">
                <Checkbox checked={(data.motivazione || []).includes(opt.id)} onCheckedChange={() => !readOnly && toggleArrayValue('motivazione', opt.id)} disabled={readOnly} className="h-3 w-3" />
                <span className="text-[11px]">{opt.label}</span>
              </span>
            ))}
            {(data.motivazione || []).includes('altro') && (
              <Input value={data.motivazione_altro || ''} onChange={e => setFormData(p => ({...p, motivazione_altro: e.target.value}))} disabled={readOnly} className="h-6 text-xs w-32" placeholder="specificare" />
            )}
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <div className="border-2 border-gray-300 p-2 space-y-2">
        <div className="flex items-center gap-4">
          <Label className="font-semibold text-xs">DATA POSIZIONAMENTO:</Label>
          <Input type="date" value={data.data_posizionamento || ''} onChange={e => setFormData(p => ({...p, data_posizionamento: e.target.value}))} disabled={readOnly} className="h-7 text-xs w-36" />
        </div>
        <div className="flex items-center gap-4">
          <Label className="text-xs">OPERATORE CHE HA IMPIANTATO:</Label>
          <Input value={data.operatore || ''} onChange={e => setFormData(p => ({...p, operatore: e.target.value}))} disabled={readOnly} className="h-7 text-xs flex-1" />
          <Label className="text-xs">FIRMA:</Label>
          <div className="w-32 border-b-2 border-gray-400"></div>
        </div>
      </div>

      {/* ALLEGATI */}
      {!readOnly && (
        <div className="border-2 border-gray-300 p-2 space-y-2">
          <div className="flex items-center justify-between">
            <Label className="font-semibold text-xs">ALLEGATI / FOTO</Label>
            <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} className="h-7 text-xs">
              <Upload className="h-3 w-3 mr-1" /> Carica
            </Button>
            <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handlePhotoUpload} className="hidden" />
          </div>
          
          {uploadedPhotos.length > 0 ? (
            <div className="grid grid-cols-4 gap-2">
              {uploadedPhotos.map((photo) => (
                <PhotoViewer key={photo.id || photo.tempId} photo={photo} onDelete={handleDeletePhoto} />
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-400 py-3 border border-dashed rounded text-xs">Nessun allegato</div>
          )}
        </div>
      )}
    </div>
  );

  // Get label for tipo
  const getTipoLabel = (tipo) => {
    const opt = [...TIPO_CATETERE_OPTIONS, ...TIPO_IMPIANTO_SEMPLICE].find(o => o.id === tipo);
    return opt?.label || tipo || '-';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Schede Impianto PICC
        </h3>
        <Button onClick={() => setSelectTypeOpen(true)} data-testid="new-scheda-impianto-btn">
          <Plus className="h-4 w-4 mr-2" /> Nuova Scheda
        </Button>
      </div>

      {/* Lista schede esistenti */}
      {schede && schede.length > 0 ? (
        <div className="grid gap-3">
          {schede.map((scheda) => (
            <Card key={scheda.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="py-3 px-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {scheda.scheda_type === 'completa' ? (
                      <FileCheck className="h-5 w-5 text-green-600" />
                    ) : (
                      <FileEdit className="h-5 w-5 text-blue-600" />
                    )}
                    <div>
                      <CardTitle className="text-sm">
                        {scheda.scheda_type === 'completa' ? 'Scheda Completa' : 'Scheda Semplificata'} - {scheda.data_posizionamento || scheda.data_impianto ? format(new Date(scheda.data_posizionamento || scheda.data_impianto), "dd/MM/yyyy", { locale: it }) : 'N/D'}
                      </CardTitle>
                      <p className="text-xs text-gray-500">
                        {getTipoLabel(scheda.tipo_catetere)} | {scheda.braccio === 'dx' ? 'Destro' : scheda.braccio === 'sn' ? 'Sinistro' : '-'} | {VENA_OPTIONS.find(o => o.id === scheda.vena)?.label || '-'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {scheda.scheda_type === 'completa' && (
                      <>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDownloadPDF(scheda)} title="Scarica PDF">
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => window.print()} title="Stampa">
                          <Printer className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditDialog(scheda)} title="Visualizza/Modifica">
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => { setSelectedScheda(scheda); setDeleteDialogOpen(true); }} title="Elimina">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="bg-gray-50">
          <CardContent className="py-8 text-center text-gray-500">
            <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Nessuna scheda impianto registrata</p>
          </CardContent>
        </Card>
      )}

      {/* Dialog Selezione Tipo Scheda */}
      <Dialog open={selectTypeOpen} onOpenChange={setSelectTypeOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nuova Scheda Impianto</DialogTitle>
            <DialogDescription>Seleziona il tipo di scheda da creare</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div 
              className="border-2 rounded-lg p-4 cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all text-center"
              onClick={() => openNewScheda('semplificata')}
            >
              <FileEdit className="h-10 w-10 mx-auto mb-2 text-blue-600" />
              <h4 className="font-semibold">Semplificata</h4>
              <p className="text-xs text-gray-500 mt-1">Campi essenziali per statistiche rapide</p>
            </div>
            <div 
              className="border-2 rounded-lg p-4 cursor-pointer hover:border-green-500 hover:bg-green-50 transition-all text-center"
              onClick={() => openNewScheda('completa')}
            >
              <FileCheck className="h-10 w-10 mx-auto mb-2 text-green-600" />
              <h4 className="font-semibold">Completa</h4>
              <p className="text-xs text-gray-500 mt-1">Modulo ufficiale stampabile in PDF</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Nuova Scheda */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className={formData.scheda_type === 'completa' ? "max-w-4xl max-h-[90vh]" : "max-w-lg max-h-[90vh]"}>
          <DialogHeader className="pb-2">
            <DialogTitle className="flex items-center gap-2">
              {formData.scheda_type === 'completa' ? <FileCheck className="h-5 w-5 text-green-600" /> : <FileEdit className="h-5 w-5 text-blue-600" />}
              {formData.scheda_type === 'completa' ? 'Nuova Scheda Completa' : 'Nuova Scheda Semplificata'}
            </DialogTitle>
          </DialogHeader>
          
          <ScrollArea className="max-h-[70vh] pr-2">
            {formData.scheda_type === 'semplificata' 
              ? renderSimplifiedForm(formData, false)
              : renderFullForm(formData, false)
            }
          </ScrollArea>

          <div className="flex justify-end gap-2 pt-3 border-t">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Annulla</Button>
            <Button onClick={handleCreate} disabled={saving}>
              {saving ? "Salvataggio..." : "Salva Scheda"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Visualizza/Modifica */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className={formData.scheda_type === 'completa' ? "max-w-4xl max-h-[90vh]" : "max-w-lg max-h-[90vh]"}>
          <DialogHeader className="pb-2">
            <DialogTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                {formData.scheda_type === 'completa' ? <FileCheck className="h-5 w-5 text-green-600" /> : <FileEdit className="h-5 w-5 text-blue-600" />}
                {formData.scheda_type === 'completa' ? 'Scheda Completa' : 'Scheda Semplificata'}
              </span>
              {!isEditing && (
                <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                  <Edit2 className="h-4 w-4 mr-1" /> Modifica
                </Button>
              )}
            </DialogTitle>
          </DialogHeader>
          
          <ScrollArea className="max-h-[70vh] pr-2">
            {formData.scheda_type === 'semplificata' 
              ? renderSimplifiedForm(formData, !isEditing)
              : renderFullForm(formData, !isEditing)
            }
          </ScrollArea>

          <div className="flex justify-end gap-2 pt-3 border-t">
            {isEditing ? (
              <>
                <Button variant="outline" onClick={() => setIsEditing(false)}>Annulla</Button>
                <Button onClick={handleUpdate} disabled={saving}>
                  {saving ? "Salvataggio..." : "Salva Modifiche"}
                </Button>
              </>
            ) : (
              <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Chiudi</Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Conferma Eliminazione */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Conferma eliminazione</AlertDialogTitle>
            <AlertDialogDescription>
              Sei sicuro di voler eliminare questa scheda impianto? L'azione non può essere annullata.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-500 hover:bg-red-600">
              Elimina
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default SchedaImpiantoPICC;
