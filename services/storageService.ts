import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { Cliente, Servico, Despesa } from '../types';

// Configuração do Firebase fornecida
const firebaseConfig = {
  apiKey: "AIzaSyC1_09Apwtig0HT0fK3rxwNPR9Im_f2FjM",
  authDomain: "solartekpro-c3fad.firebaseapp.com",
  databaseURL: "https://solartekpro-c3fad-default-rtdb.firebaseio.com",
  projectId: "solartekpro-c3fad",
  storageBucket: "solartekpro-c3fad.firebasestorage.app",
  messagingSenderId: "91595897402",
  appId: "1:91595897402:web:41e2c062a09655b0521303"
};

// Inicializar o aplicativo Firebase
const app = initializeApp(firebaseConfig);
// Inicializar o Firestore
const db = getFirestore(app);

// Nomes das coleções no Firestore
const COL_CLIENTES = 'clientes';
const COL_SERVICOS = 'servicos';
const COL_DESPESAS = 'despesas';

export const StorageService = {
  // --- Clientes (Firestore) ---
  getClientes: async (): Promise<Cliente[]> => {
    try {
      const querySnapshot = await getDocs(collection(db, COL_CLIENTES));
      const clientes: Cliente[] = [];
      querySnapshot.forEach((doc) => {
        clientes.push(doc.data() as Cliente);
      });
      return clientes;
    } catch (error) {
      console.error("Erro ao buscar clientes do Firebase:", error);
      return [];
    }
  },

  saveCliente: async (cliente: Cliente): Promise<Cliente> => {
    try {
      // Usa o ID do cliente como ID do documento para facilitar atualizações
      await setDoc(doc(db, COL_CLIENTES, cliente.id), cliente);
      return cliente;
    } catch (e: any) {
      console.error("Erro ao salvar cliente no Firebase:", e);
      // Erro comum: Documento muito grande (limite de 1MB do Firestore)
      if (e.code === 'permission-denied') {
        throw new Error("PERMISSAO_NEGADA");
      } else if (e.toString().includes("exceeds the maximum size")) {
        throw new Error("LIMITE_ATINGIDO"); 
      }
      throw e;
    }
  },

  deleteCliente: async (id: string): Promise<void> => {
    try {
      await deleteDoc(doc(db, COL_CLIENTES, id));
    } catch (error) {
      console.error("Erro ao excluir cliente:", error);
      throw error;
    }
  },

  // --- Serviços (Firestore) ---
  getServicos: async (): Promise<Servico[]> => {
    try {
      const querySnapshot = await getDocs(collection(db, COL_SERVICOS));
      const servicos: Servico[] = [];
      querySnapshot.forEach((doc) => {
        servicos.push(doc.data() as Servico);
      });
      return servicos;
    } catch (error) {
      console.error("Erro ao buscar serviços:", error);
      return [];
    }
  },

  saveServico: async (servico: Servico): Promise<Servico> => {
    try {
      await setDoc(doc(db, COL_SERVICOS, servico.id), servico);
      return servico;
    } catch (error) {
      console.error("Erro ao salvar serviço:", error);
      throw error;
    }
  },

  deleteServico: async (id: string): Promise<void> => {
    try {
      await deleteDoc(doc(db, COL_SERVICOS, id));
    } catch (error) {
      console.error("Erro ao excluir serviço:", error);
      throw error;
    }
  },

  // --- Despesas (Firestore) ---
  getDespesas: async (): Promise<Despesa[]> => {
    try {
      const querySnapshot = await getDocs(collection(db, COL_DESPESAS));
      const despesas: Despesa[] = [];
      querySnapshot.forEach((doc) => {
        despesas.push(doc.data() as Despesa);
      });
      return despesas;
    } catch (error) {
      console.error("Erro ao buscar despesas:", error);
      return [];
    }
  },

  saveDespesa: async (despesa: Despesa): Promise<Despesa> => {
    try {
      await setDoc(doc(db, COL_DESPESAS, despesa.id), despesa);
      return despesa;
    } catch (error) {
      console.error("Erro ao salvar despesa:", error);
      throw error;
    }
  },

  deleteDespesa: async (id: string): Promise<void> => {
    try {
      await deleteDoc(doc(db, COL_DESPESAS, id));
    } catch (error) {
      console.error("Erro ao excluir despesa:", error);
      throw error;
    }
  },

  // --- Utils (Mantido para compressão de imagem) ---
  fileToBase64: (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      // Se for PDF ou não for imagem, converte normal
      if (!file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
        return;
      }

      // Compressão de Imagem Otimizada para Firestore (Max 1MB per doc)
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          // Redimensionar agressivo (Max 800px) para garantir que cabe no Firestore
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 800;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          ctx?.drawImage(img, 0, 0, width, height);

          // Comprimir JPEG qualidade 0.5
          const dataUrl = canvas.toDataURL('image/jpeg', 0.5);
          resolve(dataUrl);
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = error => reject(error);
    });
  }
};