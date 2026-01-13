import React, { useState, useCallback } from 'react';
import { StepIndicator } from './components/StepIndicator';
import { ImageUploadField } from './components/ImageUploadField';
import { AnalysisCharts } from './components/AnalysisCharts';
import { SettingsModal } from './components/SettingsModal';
import { ProfileModal } from './components/ProfileModal';
import { LoginScreen } from './components/LoginScreen';
import { 
  generateTryOnImage, 
  analyzeSareePotential, 
  fileToBase64,
  getProductShotConfigs,
  generateSingleProductShot,
  generateSEODetails
} from './services/geminiService';
import { 
  AppStep, 
  SareeFormData, 
  GenerationState,
  ProductWorkflowItem,
  Vendor,
  User
} from './types';
import { 
  DEFAULT_BG_DESC, 
  DEFAULT_FIGURE_DESC, 
  DEFAULT_ATTIRE_DESC, 
  MAX_PRODUCT_IMAGES, 
  USERS as INITIAL_USERS,
  SEASONS,
  OCCASIONS
} from './constants';
import { Loader2, TrendingUp, Check, Download, AlertCircle, RefreshCw, Sparkles, ChevronRight, Square, CheckSquare, Settings, LogOut, MessageSquarePlus, User as UserIcon, Image as ImageIcon, Tag, IndianRupee, Copy } from 'lucide-react';
import JSZip from 'jszip';

const App: React.FC = () => {
  // Authentication State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);

  // App State
  const [step, setStep] = useState<AppStep>(AppStep.Upload);
  const [completedSteps, setCompletedSteps] = useState<AppStep[]>([]);
  
  // Settings & Modal State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [vendors, setVendors] = useState<Vendor[]>([
    { id: 'default-1', name: 'Moushumi', code: 'Mou' }
  ]);
  const [apiKeys, setApiKeys] = useState<string[]>(['AIzaSyBee269xEDUTkowA3zSU3Wq2Bo2crleROg']);

  // Form Data
  const [formData, setFormData] = useState<SareeFormData>({
    productImages: [],
    modelFace: null,
    modelFigureDesc: DEFAULT_FIGURE_DESC,
    backgroundDesc: DEFAULT_BG_DESC,
    attireDesc: DEFAULT_ATTIRE_DESC,
  });

  // Multi-product State
  const [products, setProducts] = useState<ProductWorkflowItem[]>([]);
  const [currentProcessingIndex, setCurrentProcessingIndex] = useState<number>(-1);
  const [copySourceInputs, setCopySourceInputs] = useState<Record<string, string>>({});

  // UI State
  const [status, setStatus] = useState<GenerationState>({
    isGenerating: false,
    isAnalyzing: false,
    error: null
  });

  // Helpers
  const getActiveKey = () => apiKeys.length > 0 ? apiKeys[0] : undefined;

  // Error Formatter
  const formatErrorMessage = (err: any): string => {
    const errorStr = typeof err === 'string' ? err : JSON.stringify(err);
    if (errorStr.includes('RESOURCE_EXHAUSTED') || errorStr.includes('429')) {
      return "The AI service is currently reaching its capacity limit. Please wait 30-60 seconds and try again.";
    }
    return err.message || "An unexpected error occurred. Please try again.";
  };

  // Binoculars Cipher Logic: B=0, I=1, N=2, O=3, C=4, U=5, L=6, A=7, R=8, S=9
  const calculateBinocularsCode = (price: string) => {
    const map = ['B', 'I', 'N', 'O', 'C', 'U', 'L', 'A', 'R', 'S'];
    return price.split('').map(char => {
        const digit = parseInt(char);
        return isNaN(digit) ? char : map[digit];
    }).join('');
  };

  const generateSKU = (vendorCode: string, costPrice: string, productType: 'NOS' | 'Seasonal') => {
    const now = new Date();
    const dateStr = `${now.getDate().toString().padStart(2, '0')}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getFullYear()}${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}`;
    
    // Strictly integer part for cipher code
    const integerCost = (costPrice || '0').split('.')[0];
    const costCode = calculateBinocularsCode(integerCost);
    
    const suffix = productType === 'NOS' ? '-NOS' : '-NNOS';
    return `${dateStr}-${vendorCode || 'UNK'}-${costCode || '000'}${suffix}`;
  };

  const updateFormData = (key: keyof SareeFormData, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleUpdateUser = (updates: Partial<User> & { newPassword?: string }) => {
    if (!currentUser) return;
    if (updates.newPassword) {
      setUsers(prev => prev.map(u => 
        u.username === currentUser.username 
          ? { ...u, password: updates.newPassword, ...updates, newPassword: undefined } 
          : u
      ));
      setCurrentUser(prev => prev ? { ...prev, password: updates.newPassword } : null);
    } else {
      setUsers(prev => prev.map(u => 
        u.username === currentUser.username 
          ? { ...u, ...updates } 
          : u
      ));
      setCurrentUser(prev => prev ? { ...prev, ...updates } : null);
    }
  };

  const toggleProductSelection = (id: string, currentStep: AppStep) => {
    setProducts(prev => prev.map(p => {
      if (p.id !== id) return p;
      switch (currentStep) {
        case AppStep.VisualizeAndAnalyze: return { ...p, step2Selected: !p.step2Selected };
        case AppStep.EcommerceImages:
          const newSelected = !p.step3Selected;
          return { ...p, step3Selected: newSelected, ecommerceImages: p.ecommerceImages?.map(img => ({ ...img, selected: newSelected })) };
        case AppStep.ProductDetails: return { ...p, step4Selected: !p.step4Selected };
        case AppStep.Export: return { ...p, step5Selected: !p.step5Selected };
        default: return p;
      }
    }));
  };

  const toggleImageSelection = (productId: string, imageId: string) => {
      setProducts(prev => prev.map(p => {
          if (p.id !== productId) return p;
          return { ...p, ecommerceImages: p.ecommerceImages?.map(img => img.id === imageId ? { ...img, selected: !img.selected } : img) };
      }));
  };

  const toggleShotRefining = (productId: string, shotId: string) => {
      setProducts(prev => prev.map(p => {
          if (p.id !== productId) return p;
          return {
              ...p,
              ecommerceImages: p.ecommerceImages?.map(s => {
                  if (s.id === shotId) {
                      const isRefining = !s.isRefining;
                      let feedback = s.feedback;
                      if (isRefining && (!feedback || feedback.trim() === '')) {
                          switch (shotId) {
                              case 'left-profile': feedback = 'The shot must be a left profile view, side angle full body shot. Left shoulder is facing the camera, and pallu is on the left shoulder.'; break;
                              case 'right-profile': feedback = 'The shot must be a Right profile view, side angle full body shot. Right shoulder is facing the camera, and pallu is on the left shoulder.'; break;
                              case 'detailed-profile': feedback = 'The shot must be a close-up view, Model facing the camera, with the same studio background. Picture taken till the upper Stomach.'; break;
                              case 'back-profile': feedback = 'The shot must be a full-body back view, the Model holding the pallu with the right hand, a Complete backside view of the model, and the model facing other side of the camera'; break;
                          }
                      }
                      return { ...s, isRefining, feedback };
                  }
                  return s;
              })
          };
      }));
  };

  const updateShotFeedback = (productId: string, shotId: string, text: string) => {
      setProducts(prev => prev.map(p => {
          if (p.id !== productId) return p;
          return { ...p, ecommerceImages: p.ecommerceImages?.map(s => s.id === shotId ? { ...s, feedback: text } : s) };
      }));
  };

  const selectAll = (currentStep: AppStep, select: boolean) => {
     setProducts(prev => prev.map(p => {
        let canSelect = false;
        if (currentStep === AppStep.VisualizeAndAnalyze && p.step2Status === 'success') canSelect = true;
        if (currentStep === AppStep.EcommerceImages && p.step3Status === 'success') canSelect = true;
        if (currentStep === AppStep.ProductDetails && p.step4Status === 'success') canSelect = true;
        if (currentStep === AppStep.Export) canSelect = true;
        if (!canSelect) return p;
        switch (currentStep) {
            case AppStep.VisualizeAndAnalyze: return { ...p, step2Selected: select };
            case AppStep.EcommerceImages: return { ...p, step3Selected: select, ecommerceImages: p.ecommerceImages?.map(img => ({ ...img, selected: select })) };
            case AppStep.ProductDetails: return { ...p, step4Selected: select };
            case AppStep.Export: return { ...p, step5Selected: select };
            default: return p;
        }
     }));
  };

  const updateProductDetails = (id: string, field: keyof ProductWorkflowItem['details'], value: any) => {
      setProducts(prev => prev.map(p => {
          if (p.id !== id) return p;
          const updates: Partial<ProductWorkflowItem['details']> = { [field]: value };
          if (field === 'productType' && value === 'NOS') { updates.season = [...SEASONS]; }
          return { ...p, details: { ...p.details, ...updates } };
      }));
  };

  const handleCopyProductData = (targetId: string, sourceNumber: string) => {
    const activeProducts = products.filter(p => p.step3Selected && p.step3Status === 'success');
    const sourceIdx = parseInt(sourceNumber) - 1;
    if (isNaN(sourceIdx) || sourceIdx < 0 || sourceIdx >= activeProducts.length) { alert("Invalid product number."); return; }
    const sourceProduct = activeProducts[sourceIdx];
    if (sourceProduct.id === targetId) { alert("Cannot copy from the same product."); return; }
    setProducts(prev => prev.map(p => {
      if (p.id !== targetId) return p;
      return { ...p, details: { ...sourceProduct.details, seo: undefined } };
    }));
    setCopySourceInputs(prev => ({ ...prev, [targetId]: '' }));
  };

  const toggleDetailArrayItem = (productId: string, field: 'season' | 'wear', item: string) => {
    setProducts(prev => prev.map(p => {
        if (p.id !== productId) return p;
        const currentList = p.details[field] as string[];
        const newList = currentList.includes(item) ? currentList.filter(i => i !== item) : [...currentList, item];
        return { ...p, details: { ...p.details, [field]: newList } };
    }));
  };

  const handleStartAnalysis = useCallback(async () => {
    if (formData.productImages.length === 0) { setStatus(prev => ({ ...prev, error: "Please upload at least one saree image." })); return; }
    if (!formData.modelFace) { setStatus(prev => ({ ...prev, error: "Please upload a model face image." })); return; }
    const newProducts: ProductWorkflowItem[] = formData.productImages.map((file, idx) => ({
      id: `prod-${Date.now()}-${idx}`,
      file,
      step2Selected: true,
      step2Status: 'idle',
      step3Selected: true,
      step3Status: 'idle',
      ecommerceImages: getProductShotConfigs(),
      step4Selected: true,
      step4Status: 'idle',
      details: { vendorCode: '', costPrice: '', salePrice: '', mrp: '', fabric: '', design: '', blouseIncluded: 'Yes', productType: 'Seasonal', season: [], wear: [] },
      step5Selected: true,
    }));
    setProducts(newProducts);
    setStep(AppStep.Upload);
    setTimeout(() => setStep(AppStep.VisualizeAndAnalyze), 10);
    setStatus({ isGenerating: true, isAnalyzing: true, error: null });
    const activeKey = getActiveKey();
    try {
        const faceBase64 = await fileToBase64(formData.modelFace);
        for (let i = 0; i < newProducts.length; i++) {
            setCurrentProcessingIndex(i);
            const prod = newProducts[i];
            try {
                setProducts(prev => prev.map(p => p.id === prod.id ? { ...p, step2Status: 'loading' } : p));
                const sareeBase64 = await fileToBase64(prod.file);
                const [generatedImgUrl, analysis] = await Promise.all([
                    generateTryOnImage(sareeBase64, faceBase64, formData.modelFigureDesc, formData.backgroundDesc, formData.attireDesc, activeKey),
                    analyzeSareePotential(sareeBase64, formData.attireDesc, activeKey)
                ]);
                setProducts(prev => prev.map(p => p.id === prod.id ? { ...p, tryOnImage: generatedImgUrl, analysis: analysis, step2Status: 'success' as const } : p));
            } catch (error: any) {
                setProducts(prev => prev.map(p => p.id === prod.id ? { ...p, step2Status: 'error' as const, step2Error: formatErrorMessage(error) } : p));
            }
            if (i < newProducts.length - 1) { await new Promise(resolve => setTimeout(resolve, 4000)); }
        }
        if (!completedSteps.includes(AppStep.VisualizeAndAnalyze)) { setCompletedSteps(prev => [...prev, AppStep.Upload, AppStep.VisualizeAndAnalyze]); }
    } catch (err: any) {
        setStatus(prev => ({ ...prev, error: formatErrorMessage(err) }));
    } finally {
        setStatus(prev => ({ ...prev, isGenerating: false, isAnalyzing: false }));
        setCurrentProcessingIndex(-1);
    }
  }, [formData, completedSteps, apiKeys]);

  const handleRegenerateTryOn = async (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    setProducts(prev => prev.map(p => p.id === productId ? { ...p, tryOnImage: undefined, step2Status: 'loading' } : p));
    try {
        const sareeBase64 = await fileToBase64(product.file);
        const faceBase64 = formData.modelFace ? await fileToBase64(formData.modelFace) : null;
        const generatedImgUrl = await generateTryOnImage(sareeBase64, faceBase64, formData.modelFigureDesc, formData.backgroundDesc, formData.attireDesc, getActiveKey());
        setProducts(prev => prev.map(p => p.id === productId ? { ...p, tryOnImage: generatedImgUrl, step2Status: 'success' } : p));
    } catch (error: any) {
         setProducts(prev => prev.map(p => p.id === productId ? { ...p, step2Status: 'error', step2Error: formatErrorMessage(error) } : p));
    }
  };

  const handleProceedToProductShots = async () => {
    const selectedProducts = products.filter(p => p.step2Selected && p.step2Status === 'success');
    if (selectedProducts.length === 0) { alert("Please select at least one product to proceed."); return; }
    setStep(AppStep.EcommerceImages);
    setStatus({ isGenerating: true, isAnalyzing: false, error: null });
    const itemsToProcess = selectedProducts.filter(p => p.step3Status !== 'success');
    if (itemsToProcess.length > 0) {
         setProducts(prev => prev.map(p => itemsToProcess.find(it => it.id === p.id) ? { ...p, step3Status: 'loading' } : p));
         const faceBase64 = formData.modelFace ? await fileToBase64(formData.modelFace) : null;
         const activeKey = getActiveKey();
         (async () => {
            for (const prod of itemsToProcess) {
                try {
                    const sareeBase64 = await fileToBase64(prod.file);
                    const initialImages = getProductShotConfigs(); 
                    setProducts(prev => prev.map(p => (p.id === prod.id && (!p.ecommerceImages || p.ecommerceImages.every(img => img.status === 'idle'))) ? { ...p, ecommerceImages: initialImages } : p));
                    const shotConfigs = initialImages; 
                    for (let i = 0; i < shotConfigs.length; i++) {
                        const shotConfig = shotConfigs[i];
                        if (shotConfig.type === 'source') {
                             const originalUrl = URL.createObjectURL(prod.file);
                             setProducts(prev => prev.map(p => p.id === prod.id ? { ...p, ecommerceImages: p.ecommerceImages?.map(img => img.id === shotConfig.id ? { ...img, status: 'success', url: originalUrl } : img) } : p));
                             continue;
                        }
                        setProducts(prev => prev.map(p => p.id === prod.id ? { ...p, ecommerceImages: p.ecommerceImages?.map(img => img.id === shotConfig.id ? { ...img, status: 'loading' } : img) } : p));
                        try {
                             const url = await generateSingleProductShot(sareeBase64, faceBase64, prod.tryOnImage || null, shotConfig, { figureDesc: formData.modelFigureDesc, bgDesc: formData.backgroundDesc, attireDesc: formData.attireDesc }, activeKey);
                             setProducts(prev => prev.map(p => p.id === prod.id ? { ...p, ecommerceImages: p.ecommerceImages?.map(img => img.id === shotConfig.id ? { ...img, status: 'success', url } : img) } : p));
                        } catch (e) {
                            setProducts(prev => prev.map(p => p.id === prod.id ? { ...p, ecommerceImages: p.ecommerceImages?.map(img => img.id === shotConfig.id ? { ...img, status: 'error' } : img) } : p));
                        }
                        await new Promise(resolve => setTimeout(resolve, 2000));
                    }
                    setProducts(prev => prev.map(p => p.id === prod.id ? { ...p, step3Status: 'success' } : p));
                    await new Promise(resolve => setTimeout(resolve, 2000));
                } catch (e: any) {
                     setProducts(prev => prev.map(p => p.id === prod.id ? { ...p, step3Status: 'error', step3Error: formatErrorMessage(e) } : p));
                }
             }
             setStatus(prev => ({ ...prev, isGenerating: false }));
         })();
    } else { setStatus(prev => ({ ...prev, isGenerating: false })); }
    if (!completedSteps.includes(AppStep.EcommerceImages)) { setCompletedSteps(prev => [...prev, AppStep.EcommerceImages]); }
  };

  const handleRegenerateShot = async (productId: string, shotId: string) => {
      const product = products.find(p => p.id === productId);
      const shot = product?.ecommerceImages?.find(s => s.id === shotId);
      if (!product || !shot || shot.type === 'source') return;
      setProducts(prev => prev.map(p => p.id === productId ? { ...p, ecommerceImages: p.ecommerceImages?.map(s => s.id === shotId ? { ...s, status: 'loading' } : s) } : p));
      try {
          const sareeBase64 = await fileToBase64(product.file);
          const faceBase64 = formData.modelFace ? await fileToBase64(formData.modelFace) : null;
          const url = await generateSingleProductShot(sareeBase64, faceBase64, product.tryOnImage || null, { ...shot, feedback: shot.isRefining ? shot.feedback : undefined }, { figureDesc: formData.modelFigureDesc, bgDesc: formData.backgroundDesc, attireDesc: formData.attireDesc }, getActiveKey());
          setProducts(prev => prev.map(p => p.id === productId ? { ...p, ecommerceImages: p.ecommerceImages?.map(s => s.id === shotId ? { ...s, status: 'success', url } : s) } : p));
      } catch (e) {
          setProducts(prev => prev.map(p => p.id === productId ? { ...p, ecommerceImages: p.ecommerceImages?.map(s => s.id === shotId ? { ...s, status: 'error' } : s) } : p));
      }
  };

  const handleProceedToDetails = () => {
      if (products.filter(p => p.step3Selected && p.step3Status === 'success').length === 0) { alert("Please select at least one product to proceed."); return; }
      setStep(AppStep.ProductDetails);
      if (!completedSteps.includes(AppStep.ProductDetails)) { setCompletedSteps(prev => [...prev, AppStep.ProductDetails]); }
  }

  const handleGenerateSEO = async (productId: string) => {
      const product = products.find(p => p.id === productId);
      if (!product) return;
      if (!product.details.fabric || !product.details.design || !product.details.costPrice) { alert("Please enter Fabric, Design, and Cost Price to generate SKU and SEO."); return; }
      setProducts(prev => prev.map(p => p.id === productId ? { ...p, step4Status: 'loading' } : p));
      try {
          const sareeBase64 = await fileToBase64(product.file);
          const seoData = await generateSEODetails(sareeBase64, product.details.fabric, product.details.design, formData.attireDesc, getActiveKey());
          const customSku = generateSKU(product.details.vendorCode, product.details.costPrice, product.details.productType);
          setProducts(prev => prev.map(p => p.id === productId ? { ...p, details: { ...p.details, seo: { ...seoData, sku: customSku } }, step4Status: 'success' } : p));
      } catch (e: any) {
          setProducts(prev => prev.map(p => p.id === productId ? { ...p, step4Status: 'error', step4Error: formatErrorMessage(e) } : p));
      }
  };

  const handleDownloadZip = async () => {
    const selectedProducts = products.filter(p => p.step3Selected && p.step3Status === 'success' && p.step5Selected);
    if (selectedProducts.length === 0) { alert("Please select at least one product to download."); return; }
    setStatus(prev => ({ ...prev, isGenerating: true }));
    const convertToPngBlob = (file: File): Promise<Blob> => {
        return new Promise((resolve, reject) => {
            const img = new Image(); const url = URL.createObjectURL(file);
            img.onload = () => {
                const canvas = document.createElement('canvas'); canvas.width = img.width; canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                if (ctx) { ctx.drawImage(img, 0, 0); canvas.toBlob((blob) => { URL.revokeObjectURL(url); if (blob) resolve(blob); else reject(new Error('PNG conversion failed')); }, 'image/png'); } 
                else { URL.revokeObjectURL(url); reject(new Error('Canvas context failed')); }
            };
            img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Image load failed')); };
            img.src = url;
        });
    };
    try {
        const zip = new JSZip();
        for (const product of selectedProducts) {
            const safeSku = (product.details.seo?.sku || product.id).replace(/[^a-z0-9-_]/gi, '_');
            const folder = zip.folder(safeSku); if (!folder) continue;
            let imageCounter = 1;
            const getNextImageName = () => `${safeSku}_IMG${String(imageCounter++).padStart(2, '0')}.png`;
            try { const pngBlob = await convertToPngBlob(product.file); folder.file(getNextImageName(), pngBlob); } catch { folder.file(`${safeSku}_IMG${String(imageCounter++).padStart(2, '0')}.png`, product.file); }
            if (product.tryOnImage) { folder.file(getNextImageName(), product.tryOnImage.split(',')[1], { base64: true }); }
            if (product.ecommerceImages) {
                for (const shot of product.ecommerceImages.filter(s => s.selected && s.status === 'success' && s.url && s.type !== 'source')) {
                     folder.file(getNextImageName(), shot.url!.split(',')[1], { base64: true });
                }
            }
            folder.file(`${safeSku}_Details.json`, JSON.stringify({ id: product.id, metadata: product.details, analysis: product.analysis }, null, 2));
        }
        const content = await zip.generateAsync({ type: "blob" });
        const downloadUrl = URL.createObjectURL(content); const link = document.createElement('a'); link.href = downloadUrl;
        link.download = `saree-ai-export-${new Date().toISOString().slice(0, 10)}.zip`; document.body.appendChild(link); link.click(); document.body.removeChild(link); URL.revokeObjectURL(downloadUrl);
    } catch (error: any) { alert("Failed to generate zip: " + error.message); } finally { setStatus(prev => ({ ...prev, isGenerating: false })); }
  };

  const renderStep1 = () => (
    <div className="max-w-5xl mx-auto">
      <div className="bg-white rounded-2xl shadow-sm p-8 border border-slate-100">
        <h2 className="text-2xl font-serif font-bold text-primary-900 mb-6">Product & Model Details</h2>
        <div className="grid md:grid-cols-2 gap-8">
            <ImageUploadField label="Saree Product Images" subLabel={`Upload up to ${MAX_PRODUCT_IMAGES} images.`} files={formData.productImages} multiple={true} maxFiles={MAX_PRODUCT_IMAGES} onFilesSelected={(newFiles) => updateFormData('productImages', [...formData.productImages, ...newFiles])} onRemoveFile={(idx) => updateFormData('productImages', formData.productImages.filter((_, i) => i !== idx))} />
            <ImageUploadField label="Model Face" subLabel="Upload a close-up." files={formData.modelFace ? [formData.modelFace] : []} maxFiles={1} onFilesSelected={(files) => updateFormData('modelFace', files[0])} onRemoveFile={() => updateFormData('modelFace', null)} />
        </div>
        <div className="grid md:grid-cols-2 gap-6 mb-8 mt-6">
          <div><label className="block text-sm font-semibold text-slate-700 mb-2">Model Figure</label><textarea value={formData.modelFigureDesc} onChange={(e) => updateFormData('modelFigureDesc', e.target.value)} className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none h-32 resize-none" placeholder="Describe the model..." /></div>
          <div><label className="block text-sm font-semibold text-slate-700 mb-2">Background</label><textarea value={formData.backgroundDesc} onChange={(e) => updateFormData('backgroundDesc', e.target.value)} className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none h-32 resize-none" placeholder="Describe setting..." /></div>
          <div className="md:col-span-2"><label className="block text-sm font-semibold text-slate-700 mb-2">Attire Details</label><textarea value={formData.attireDesc} onChange={(e) => updateFormData('attireDesc', e.target.value)} className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none h-32 resize-none" placeholder="Fabric details..." /></div>
        </div>
        <button onClick={handleStartAnalysis} disabled={formData.productImages.length === 0 || !formData.modelFace} className="w-full py-4 bg-primary-700 hover:bg-primary-900 text-white rounded-xl font-bold text-lg shadow-lg flex justify-center items-center gap-2"><span>Generate Visualization & Analytics</span><TrendingUp size={20} /></button>
        {status.error && <div className="mt-4 p-4 bg-red-50 text-red-600 rounded-lg border border-red-100 flex items-center gap-2 font-medium"><AlertCircle size={18} /> {status.error}</div>}
      </div>
    </div>
  );

  const renderStep2 = () => {
    if (status.isGenerating && products.every(p => p.step2Status === 'idle')) { return (<div className="flex flex-col items-center justify-center h-[60vh] space-y-6"><div className="relative"><div className="absolute inset-0 rounded-full bg-primary-100 animate-ping opacity-75"></div><Loader2 className="w-16 h-16 text-primary-600 animate-spin relative z-10" /></div><div className="text-center"><h3 className="text-xl font-serif font-bold text-slate-800">Simulating & Analyzing...</h3><p className="text-slate-500 mt-2">Initializing {products.length} products...</p></div></div>); }
    return (
      <div className="max-w-7xl mx-auto pb-20 animate-fade-in">
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-serif font-bold text-slate-900">Visualize & Analyze</h2>
            <div className="flex gap-2">
                 <button onClick={() => selectAll(AppStep.VisualizeAndAnalyze, true)} className="text-sm text-primary-700 font-medium hover:underline">Select All</button><span className="text-slate-300">|</span><button onClick={() => selectAll(AppStep.VisualizeAndAnalyze, false)} className="text-sm text-slate-500 font-medium hover:underline">Deselect All</button>
            </div>
        </div>
        <div className="space-y-8">
            {products.map((item, idx) => (
                <div key={item.id} className={`bg-white rounded-xl shadow-sm border ${item.step2Selected ? 'border-primary-500 ring-1' : 'border-slate-200'} overflow-hidden transition-all opacity-${item.step2Status === 'idle' ? '60' : '100'}`}>
                    <div className="bg-slate-50 px-6 py-3 border-b flex justify-between items-center cursor-pointer" onClick={() => toggleProductSelection(item.id, AppStep.VisualizeAndAnalyze)}>
                        <div className="flex items-center gap-3"><div className={`w-6 h-6 rounded border flex items-center justify-center ${item.step2Selected ? 'bg-primary-600 border-primary-600 text-white' : 'border-slate-300'}`}>{item.step2Selected && <Check size={14} />}</div><span className="font-semibold text-slate-700">Product #{idx + 1}</span>{item.step2Status === 'loading' && <span className="text-xs text-primary-600 flex items-center"><Loader2 size={12} className="animate-spin mr-1"/> Generating...</span>}</div>
                        {item.step2Status === 'error' && <span className="text-red-500 text-sm flex items-center gap-1"><AlertCircle size={14}/> Error</span>}{item.analysis && <span className="text-sm bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-medium">Rating: {item.analysis.rating}/10</span>}
                    </div>
                    <div className="p-6">
                        {item.step2Status === 'error' ? <div className="p-4 bg-red-50 text-red-600 rounded-lg border border-red-100 flex items-center gap-2"><AlertCircle size={18} /> {item.step2Error}</div> : (
                         <div className="grid lg:grid-cols-2 gap-8">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2"><p className="text-xs font-bold text-slate-400 uppercase">Original</p><img src={URL.createObjectURL(item.file)} className="w-full aspect-[3/4] object-contain bg-slate-50 rounded-lg" /></div>
                                <div className="space-y-2 relative"><div className="flex justify-between items-center"><p className="text-xs font-bold text-primary-600 uppercase">AI Try-On</p><button onClick={(e) => { e.stopPropagation(); handleRegenerateTryOn(item.id); }} disabled={!item.tryOnImage || item.step2Status === 'loading'} className="text-xs text-primary-600 flex items-center gap-1 hover:underline disabled:opacity-50"><RefreshCw size={12}/> Regenerate</button></div><div className="relative w-full aspect-[3/4] rounded-lg overflow-hidden border">{item.tryOnImage ? <img src={item.tryOnImage} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-slate-100 flex items-center justify-center">{item.step2Status === 'loading' ? <Loader2 className="animate-spin"/> : null}</div>}</div></div>
                            </div>
                            {item.analysis ? <div className="flex flex-col"><div><h4 className="text-sm font-semibold text-slate-700 mb-2">AI Analysis</h4><p className="text-sm text-slate-600 bg-slate-50 p-3 rounded">"{item.analysis.reasoning}"</p></div><div className="flex-1 min-h-[250px]"><p className="text-xs font-bold text-slate-400 uppercase mt-4">Style Profile</p><AnalysisCharts data={item.analysis.styleMetrics} /></div></div> : <div className="flex items-center justify-center text-slate-400 text-sm italic border-dashed border-2 rounded-lg h-full">Analysis pending...</div>}
                         </div>)}
                    </div>
                </div>
            ))}
        </div>
        <div className="sticky bottom-6 mt-8 flex justify-center"><div className="bg-white shadow-xl border p-2 rounded-2xl flex gap-4"><button onClick={() => setStep(AppStep.Upload)} className="px-6 py-3 text-slate-600 font-semibold">Back</button><button onClick={handleProceedToProductShots} className="px-8 py-3 bg-slate-900 text-white font-bold rounded-xl shadow-lg">Proceed to Product Shots ({products.filter(p => p.step2Selected && p.step2Status === 'success').length})</button></div></div>
      </div>
    );
  };

  const renderStep3 = () => {
    const activeProducts = products.filter(p => p.step2Selected && p.step2Status === 'success');
    if (status.isGenerating && activeProducts.every(p => p.step3Status === 'idle')) { return (<div className="flex flex-col items-center justify-center py-20"><Loader2 className="w-10 h-10 text-primary-600 animate-spin mb-4" /><p className="text-slate-600">Setting up virtual photoshoot...</p></div>); }
    return (
        <div className="max-w-7xl mx-auto pb-20 animate-fade-in">
             <div className="flex justify-between items-center mb-6"><h2 className="text-2xl font-serif font-bold text-slate-900">Product Showcase (9 Shots)</h2><div className="flex gap-2"><button onClick={() => selectAll(AppStep.EcommerceImages, true)} className="text-sm text-primary-700 font-medium hover:underline">Select All</button><span className="text-slate-300">|</span><button onClick={() => selectAll(AppStep.EcommerceImages, false)} className="text-sm text-slate-500 font-medium hover:underline">Deselect All</button></div></div>
            <div className="space-y-16">
                {activeProducts.map((item, idx) => (
                    <div key={item.id} className={`border-b pb-12 ${!item.step3Selected ? 'opacity-50' : ''}`}><div className="flex items-center gap-4 mb-6"><div className={`w-6 h-6 rounded border flex items-center justify-center cursor-pointer ${item.step3Selected ? 'bg-primary-600 border-primary-600 text-white' : 'border-slate-300'}`} onClick={() => toggleProductSelection(item.id, AppStep.EcommerceImages)}>{item.step3Selected && <Check size={14} />}</div><div><h3 className="text-xl font-serif font-bold text-slate-800">Product #{idx+1}</h3><p className="text-sm text-slate-500">{item.ecommerceImages?.filter(i => i.status === 'success').length || 0}/9 Ready</p></div></div>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                             {item.ecommerceImages?.map((shot) => (
                                 <div key={shot.id} className="flex flex-col gap-2"><div className="group relative bg-white border rounded-lg overflow-hidden aspect-[3/4] hover:shadow-md transition-shadow">{shot.status === 'success' ? <img src={shot.url!} className="w-full h-full object-cover" /> : shot.status === 'loading' ? <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50 text-slate-400 text-xs"><Loader2 className="animate-spin mb-2" size={24}/>Generating...</div> : <div className="w-full h-full bg-slate-100" />}{shot.status === 'success' && <div className="absolute top-2 left-2 z-10 cursor-pointer" onClick={() => toggleImageSelection(item.id, shot.id)}>{shot.selected ? <CheckSquare className="text-primary-600 bg-white/80 rounded" size={20} /> : <Square className="text-slate-400 bg-white/80 rounded" size={20} />}</div>}<div className="absolute inset-x-0 bottom-0 bg-white/90 p-2 border-t flex justify-between items-center"><span className="text-xs font-semibold truncate">{shot.label}</span><div className="flex gap-1">{shot.status === 'success' && <a href={shot.url!} download={`${item.id}-${shot.id}.png`} className="p-1.5 text-slate-400 hover:text-primary-600"><Download size={14}/></a>}{shot.type !== 'source' && <button onClick={() => handleRegenerateShot(item.id, shot.id)} className="p-1.5 text-slate-400 hover:text-blue-600" title="Regenerate"><RefreshCw size={14} className={shot.status === 'loading' ? 'animate-spin' : ''}/></button>}</div></div></div>{shot.type !== 'source' && shot.status === 'success' && <div className="px-1"><label className="flex items-center gap-2 text-xs text-slate-500 hover:text-slate-700 mb-1 select-none"><input type="checkbox" checked={shot.isRefining || false} onChange={() => toggleShotRefining(item.id, shot.id)} className="w-3 h-3 text-primary-600" /><span>Feedback mode</span></label>{shot.isRefining && <textarea value={shot.feedback || ''} onChange={(e) => updateShotFeedback(item.id, shot.id, e.target.value)} className="w-full text-[10px] p-2 border rounded resize-none" rows={2} placeholder="Instructions..." />}</div>}</div>
                             ))}
                        </div>
                    </div>
                ))}
            </div>
             <div className="sticky bottom-6 flex justify-center"><div className="bg-white shadow-xl border p-2 rounded-2xl flex gap-4"><button onClick={() => setStep(AppStep.VisualizeAndAnalyze)} className="px-6 py-3 text-slate-600">Back</button><button onClick={handleProceedToDetails} className="px-8 py-3 bg-primary-600 text-white font-bold rounded-xl shadow-lg">Provide Details ({activeProducts.filter(p => p.step3Selected && p.step3Status === 'success').length})</button></div></div>
        </div>
    );
  }

  const renderStep4 = () => {
    const activeProducts = products.filter(p => p.step3Selected && p.step3Status === 'success');
    return (
        <div className="max-w-6xl mx-auto pb-20 animate-fade-in">
             <div className="mb-6"><h2 className="text-2xl font-serif font-bold text-slate-900">Product Details & SEO</h2></div>
            <div className="space-y-8">
                {activeProducts.map((item, idx) => (
                    <div key={item.id} className="bg-white rounded-xl shadow-sm border overflow-hidden">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 border-b bg-slate-50">
                            <div className="flex items-center gap-4"><img src={item.tryOnImage} className="w-12 h-16 object-cover rounded bg-white border" /><div className="font-serif font-bold">Product #{idx + 1}</div></div>
                            {idx > 0 && (<div className="flex items-center gap-2 bg-white p-2 border rounded-lg shadow-sm"><label className="text-xs font-bold text-slate-500 flex items-center gap-1.5"><Copy size={14} className="text-primary-500" /> Copy from Product #</label><input type="number" min="1" max={idx} value={copySourceInputs[item.id] || ''} onChange={(e) => setCopySourceInputs(prev => ({ ...prev, [item.id]: e.target.value }))} className="w-12 p-1 text-center border rounded text-xs font-bold" placeholder="No." /><button onClick={() => handleCopyProductData(item.id, copySourceInputs[item.id] || '')} className="px-3 py-1 bg-primary-600 text-white text-[10px] font-bold rounded">Copy</button></div>)}
                        </div>
                        <div className="p-6">
                             <div className="grid md:grid-cols-4 gap-6 mb-8">
                                 <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Vendor Code</label><input type="text" list="vendor-list" value={item.details.vendorCode} onChange={(e) => updateProductDetails(item.id, 'vendorCode', e.target.value)} className="w-full p-2 border rounded outline-none" placeholder="Mou" /></div>
                                 <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Cost Price (INR)</label><input type="number" value={item.details.costPrice} onChange={(e) => updateProductDetails(item.id, 'costPrice', e.target.value)} className="w-full p-2 border rounded outline-none" /></div>
                                 <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Sale Price (INR)</label><input type="number" value={item.details.salePrice} onChange={(e) => updateProductDetails(item.id, 'salePrice', e.target.value)} className="w-full p-2 border rounded outline-none" /></div>
                                 <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">MRP (INR)</label><input type="number" value={item.details.mrp} onChange={(e) => updateProductDetails(item.id, 'mrp', e.target.value)} className="w-full p-2 border rounded outline-none" /></div>
                             </div>
                             <div className="grid md:grid-cols-6 gap-6 mb-8 border-t pt-6">
                                 <div className="md:col-span-2"><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Fabric</label><input type="text" value={item.details.fabric} onChange={(e) => updateProductDetails(item.id, 'fabric', e.target.value)} className="w-full p-2 border rounded outline-none" /></div>
                                 <div className="md:col-span-3"><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Design</label><input type="text" value={item.details.design} onChange={(e) => updateProductDetails(item.id, 'design', e.target.value)} className="w-full p-2 border rounded outline-none" /></div>
                                 <div className="md:col-span-1"><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Blouse</label><select value={item.details.blouseIncluded} onChange={(e) => updateProductDetails(item.id, 'blouseIncluded', e.target.value)} className="w-full p-2 border rounded outline-none"><option value="Yes">Yes</option><option value="No">No</option></select></div>
                             </div>
                             <div className="border-t pt-6 bg-slate-50 -mx-6 -mb-6 p-6 flex flex-col gap-4">
                                 <div className="flex justify-between items-center"><h4 className="font-bold text-slate-700 flex items-center gap-2"><Sparkles size={16} className="text-primary-500"/> AI SEO & SKU</h4><button onClick={() => handleGenerateSEO(item.id)} disabled={item.step4Status === 'loading' || !item.details.costPrice} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold">Generate</button></div>
                                 {item.details.seo ? <div className="bg-white p-4 rounded-lg border text-sm flex flex-col gap-2"><div><span className="text-[10px] font-bold text-slate-400 uppercase">SKU</span><p className="font-mono font-bold">{item.details.seo.sku}</p></div><div><span className="text-[10px] font-bold text-slate-400 uppercase">SEO Title</span><p>{item.details.seo.seoTitle}</p></div><div><span className="text-[10px] font-bold text-slate-400 uppercase">Description</span><p className="text-xs text-slate-600">{item.details.seo.seoDescription}</p></div></div> : (item.step4Status === 'loading' ? <div className="text-center py-6 text-slate-400 flex items-center justify-center gap-2"><Loader2 className="animate-spin" size={16}/> Writing catalog details...</div> : <div className="text-center py-6 border-dashed border-2 rounded-lg text-slate-400 text-xs">Enter pricing and fabric to generate catalog data.</div>)}
                             </div>
                        </div>
                    </div>
                ))}
            </div>
             <div className="sticky bottom-6 flex justify-center"><div className="bg-white shadow-xl border p-2 rounded-2xl flex gap-4"><button onClick={() => setStep(AppStep.EcommerceImages)} className="px-6 py-3 text-slate-600">Back</button><button onClick={() => setStep(AppStep.Export)} className="px-8 py-3 bg-green-600 text-white font-bold rounded-xl shadow-lg">Finish & Export</button></div></div>
        </div>
    );
  }

  const renderStep5 = () => {
      const finalProducts = products.filter(p => p.step3Selected && p.step3Status === 'success');
      return (
        <div className="max-w-4xl mx-auto text-center py-10 animate-fade-in"><div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6"><Check size={40} /></div><h2 className="text-3xl font-serif font-bold text-slate-900 mb-4">Project Completed</h2><p className="text-slate-600 mb-8">Catalog generated for <span className="font-bold text-slate-900">{finalProducts.length} products</span>.</p>
            <div className="grid gap-4 text-left">
                {finalProducts.map((p, i) => (
                    <div key={p.id} className={`bg-white p-4 rounded-xl shadow-sm border flex gap-4 cursor-pointer ${p.step5Selected ? 'border-green-500 ring-1' : 'opacity-60'}`} onClick={() => toggleProductSelection(p.id, AppStep.Export)}><img src={p.tryOnImage || URL.createObjectURL(p.file)} className="w-20 h-28 object-cover rounded bg-slate-100" /><div className="flex-1"><div><h3 className="font-bold text-slate-800">{p.details.seo?.seoTitle || `Product #${i+1}`}</h3><span className="text-[10px] bg-slate-100 px-2 py-1 rounded font-mono">{p.details.seo?.sku || 'NO-SKU'}</span></div><div className="grid grid-cols-4 gap-2 text-xs text-slate-500 mt-2"><div><span className="block font-bold">Price</span>₹{p.details.salePrice}</div><div><span className="block font-bold">Vendor</span>{p.details.vendorCode || '-'}</div><div><span className="block font-bold">Fabric</span>{p.details.fabric || '-'}</div></div></div></div>
                ))}
            </div>
            <div className="flex justify-center gap-4 mt-10"><button onClick={handleDownloadZip} disabled={status.isGenerating || finalProducts.filter(p => p.step5Selected).length === 0} className="px-6 py-3 bg-slate-900 text-white rounded-lg font-semibold flex items-center gap-2 disabled:opacity-50">{status.isGenerating ? <Loader2 className="animate-spin" size={20} /> : <Download size={20} />}Download Selected ({finalProducts.filter(p => p.step5Selected).length})</button><button onClick={() => window.location.reload()} className="px-6 py-3 bg-primary-600 text-white rounded-lg font-semibold">Start New Project</button></div>
        </div>
      )
  }

  if (!currentUser) { return <LoginScreen onLogin={setCurrentUser} users={users} />; }
  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <nav className="bg-white border-b sticky top-0 z-40"><div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between h-16 items-center"><span className="text-2xl font-serif font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary-700 to-gold-500">Saree.AI</span><div className="flex items-center gap-4"><button onClick={() => setIsProfileOpen(true)} className="text-right hidden sm:block p-1"><div className="text-sm font-bold text-slate-700">{currentUser.name}</div><div className="text-[10px] text-slate-500 font-bold uppercase">{currentUser.role}</div></button>{currentUser.role === 'admin' && <button onClick={() => setIsSettingsOpen(true)} className="p-2 rounded-full hover:bg-slate-100 text-slate-600 transition-colors"><Settings size={20} /></button>}<button onClick={() => setCurrentUser(null)} className="p-2 rounded-full hover:bg-red-50 text-slate-400 hover:text-red-500"><LogOut size={20} /></button></div></div></nav>
      <StepIndicator currentStep={step} setStep={setStep} completedSteps={completedSteps} />
      <main className="px-4 py-8">{step === AppStep.Upload && renderStep1()}{step === AppStep.VisualizeAndAnalyze && renderStep2()}{step === AppStep.EcommerceImages && renderStep3()}{step === AppStep.ProductDetails && renderStep4()}{step === AppStep.Export && renderStep5()}</main>
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} vendors={vendors} setVendors={setVendors} users={users} setUsers={setUsers} apiKeys={apiKeys} setApiKeys={setApiKeys} />
      {currentUser && <ProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} currentUser={currentUser} onUpdateUser={handleUpdateUser} />}
    </div>
  );
};

export default App;