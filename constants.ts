import { AppStep, UserRole } from './types';
import { Shirt, Wand2, Image as ImageIcon, FileText, Download } from 'lucide-react';

export const STEPS = [
  { id: AppStep.Upload, label: 'Upload Details', icon: Shirt },
  { id: AppStep.VisualizeAndAnalyze, label: 'Try-On & Analyze', icon: Wand2 },
  { id: AppStep.EcommerceImages, label: 'Product Shots', icon: ImageIcon },
  { id: AppStep.ProductDetails, label: 'Product Details', icon: FileText },
  { id: AppStep.Export, label: 'Summary', icon: Download },
];

export const MAX_PRODUCT_IMAGES = 5;

export const DEFAULT_FIGURE_DESC = "Female model, Indian ethnicity, height 5'8\", slim build, fair complexion, elegant posture.";
export const DEFAULT_BG_DESC = "Clean, white studio background with soft natural lighting. Minimalist aesthetic.";
export const DEFAULT_ATTIRE_DESC = "Traditional Indian Saree with blouse. High quality fabric.";

export const SEASONS = ['Summer', 'Spring', 'Winter', 'Autumn', 'Monsoon'];
export const OCCASIONS = ['Festival', 'Party', 'Family Gathering', 'Wedding Receptions', 'With Friends'];

export const PRODUCT_SHOTS_CONFIG: { id: string; label: string; type: 'model' | 'product' | 'source'; prompt: string }[] = [
  { 
    id: 'source-1', 
    label: 'Original Product', 
    type: 'source', 
    prompt: '' 
  },
  { 
    id: 'full-body', 
    label: 'Full Body Profile', 
    type: 'model', 
    prompt: 'Full body fashion shot of the model standing straight, facing camera, showcasing the entire saree drape and blouse. Visual harmony with reference.' 
  },
  { 
    id: 'back-profile', 
    label: 'Back Profile', 
    type: 'model', 
    prompt: 'Full-body studio photograph from a back three-quarter angle. Model turned away from the camera, showcasing the back design of the blouse, hair styling, and the fall of the saree. Elegant standing posture.' 
  },
  { 
    id: 'left-profile', 
    label: 'Left Side Profile', 
    type: 'model', 
    prompt: 'The shot must be a left profile view, side angle full body shot. Left shoulder is facing the camera, and pallu is on the left shoulder.' 
  },
  { 
    id: 'right-profile', 
    label: 'Right Side Profile', 
    type: 'model', 
    prompt: 'The shot must be a Right profile view, side angle full body shot. Right shoulder is facing the camera, and pallu is on the left shoulder.' 
  },
  { 
    id: 'detailed-profile', 
    label: 'Detailed Profile', 
    type: 'model', 
    prompt: 'The shot must be a close-up view, Model facing the camera, with the same studio background. Picture taken till the upper Stomach.' 
  },
  { 
    id: 'seating-profile', 
    label: 'Seating Profile', 
    type: 'model', 
    prompt: 'Model sitting elegantly on a prop (chair or stool), saree draped naturally with pleats arranged on the floor. Visual harmony with reference.' 
  },
  { 
    id: 'fabric-profile', 
    label: 'Fabric Profile', 
    type: 'product', 
    prompt: 'Extreme close-up macro photography of the saree fabric texture, embroidery, and material details. Flat lay style. Visual harmony with reference.' 
  },
  { 
    id: 'mannequin-view', 
    label: 'Mannequin View', 
    type: 'product', 
    prompt: 'Front full-length mannequin view of a saree display, standing upright with perfect showroom posture, a neutral, expressionless mannequin face, smooth matte skin finish, the saree draped neatly with crisp pleats, the pallu arranged elegantly over the shoulder, and the blouse perfectly fitted.' 
  }
];

export const USERS = [
  { 
    username: 'sbhatta4', 
    password: 'Sandesh@098!', 
    name: 'Sandesh Bhatta', 
    role: 'admin' as UserRole,
    email: 'sbhatta4@saree.ai',
    phone: '+91 00000 00000'
  },
  { 
    username: 'Admin', 
    password: 'Qwer@1234', 
    name: 'Administrator', 
    role: 'admin' as UserRole,
    email: 'admin@saree.ai',
    phone: '+91 98765 43210'
  },
  { 
    username: 'Liza', 
    password: 'Qwer@1234', 
    name: 'Liza', 
    role: 'moderator' as UserRole,
    email: 'liza@saree.ai',
    phone: '+91 98765 43211'
  }
];