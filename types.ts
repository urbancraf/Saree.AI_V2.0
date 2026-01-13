
export enum AppStep {
  Upload = 0,
  VisualizeAndAnalyze = 1,
  EcommerceImages = 2,
  ProductDetails = 3,
  Export = 4
}

export interface SareeFormData {
  productImages: File[];
  modelFace: File | null;
  modelFigureDesc: string;
  backgroundDesc: string;
  attireDesc: string;
}

export interface StyleMetric {
  attribute: string;
  value: number;
  fullMark: number;
}

export interface AnalysisResult {
  engagementRate: number;
  conversionRate: number;
  rating: number; // Out of 10
  reasoning: string;
  styleMetrics: StyleMetric[];
}

export interface GenerationState {
  isGenerating: boolean;
  isAnalyzing: boolean;
  error: string | null;
}

export interface SEOData {
  seoTitle: string;
  seoDescription: string;
  sku: string;
}

export interface ProductDetailsData {
  vendorCode: string;
  costPrice: string;
  salePrice: string;
  mrp: string;
  fabric: string;
  design: string;
  blouseIncluded: string;
  season: string[];
  wear: string[];
  productType: 'NOS' | 'Seasonal';
  seo?: SEOData;
}

export interface GeneratedImage {
  id: string;
  label: string;
  type: 'model' | 'product' | 'source';
  prompt: string;
  url: string | null;
  status: 'idle' | 'loading' | 'success' | 'error';
  selected: boolean;
  feedback?: string;
  isRefining?: boolean;
}

export interface ProductWorkflowItem {
  id: string;
  file: File;
  
  // Step 2: Visualize & Analyze
  tryOnImage?: string;
  analysis?: AnalysisResult;
  step2Selected: boolean;
  step2Status: 'idle' | 'loading' | 'success' | 'error';
  step2Error?: string;

  // Step 3: Product Shots (EcommerceImages)
  ecommerceImages?: GeneratedImage[];
  step3Selected: boolean;
  step3Status: 'idle' | 'loading' | 'success' | 'error';
  step3Error?: string;

  // Step 4: Product Details & SEO
  details: ProductDetailsData;
  step4Selected: boolean;
  step4Status: 'idle' | 'loading' | 'success' | 'error';
  step4Error?: string;

  // Step 5: Export (Final State)
  step5Selected: boolean;
}

export interface Vendor {
  id: string;
  name: string;
  code: string;
}

export type UserRole = 'admin' | 'moderator';

export interface User {
  username: string;
  name: string;
  role: UserRole;
  password?: string;
  email?: string;
  phone?: string;
}