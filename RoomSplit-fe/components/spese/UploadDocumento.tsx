import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert, Platform } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker'; 
import { FileText, X, Paperclip, CheckCircle, Camera } from 'lucide-react-native'; 
import { documentiService } from '@/services/documenti'; 
import { Documento } from '@/types/types';

interface Props {
  onDocumentUploaded: (documento: Documento | null) => void;
  initialDocument?: Documento | null;
}

export default function UploadDocumento({ onDocumentUploaded, initialDocument }: Props) {
  const [uploading, setUploading] = useState(false);
  const [ocrStatus, setOcrStatus] = useState<'idle' | 'uploading' | 'processing' | 'done' | 'error'>('idle');
  const [fileCaricato, setFileCaricato] = useState<string | null>(null);

  useEffect(() => {
    if (initialDocument) {
      setFileCaricato(initialDocument.nome_file);
      setOcrStatus(initialDocument.status_ocr === 'completato' ? 'done' : 'idle');
    }
  }, [initialDocument]);

  const pollOcrStatus = async (documentoId: string) => {
    try {
      const updatedDoc = await documentiService.checkStatus(documentoId);
      
      if (updatedDoc.status_ocr === 'completato') {
        setOcrStatus('done');
        onDocumentUploaded(updatedDoc); 
      } else if (updatedDoc.status_ocr === 'fallito') {
        setOcrStatus('error');
        Alert.alert("Errore OCR", "Impossibile estrarre i dati. Compila l'importo manualmente.");
        onDocumentUploaded(updatedDoc); 
      } else {
        setTimeout(() => pollOcrStatus(documentoId), 2000);
      }
    } catch (error) {
      console.error("Errore durante il controllo OCR", error);
      setOcrStatus('error');
    }
  };

  const processUpload = async (asset: any) => {
    try {
      setUploading(true);
      setOcrStatus('uploading');
      setFileCaricato(asset.name);

      const docInAttesa = await documentiService.uploadDocumento(asset);

      setUploading(false);
      setOcrStatus('processing'); 

      pollOcrStatus(docInAttesa.id);
    } catch (err) {
      console.error("Errore upload:", err);
      Alert.alert("Errore", "Impossibile inviare il file al server.");
      setUploading(false);
      setOcrStatus('idle');
      setFileCaricato(null);
    }
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled) {
        processUpload(result.assets[0]);
      }
    } catch (err) {
      console.error("Errore selettore documenti:", err);
    }
  };

  const takePhoto = async () => {
    try {
      // Richiesta Permessi
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          "Permesso richiesto", 
          "Per scattare una foto allo scontrino abbiamo bisogno di accedere alla fotocamera."
        );
        return;
      }

      // Apertura Fotocamera
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        quality: 0.8, 
        // Permette di ritagliare lo scontrino su mobile
        allowsEditing: Platform.OS !== 'web',
      });

      if (!result.canceled) {
        const asset = result.assets[0];
        const uriParts = asset.uri.split('.');
        const fileExtension = uriParts[uriParts.length - 1];
        
        const normalizedAsset = {
          uri: asset.uri,
          name: asset.fileName || `scatto_${Date.now()}.${fileExtension}`,
          mimeType: asset.mimeType || `image/${fileExtension === 'jpg' ? 'jpeg' : fileExtension}`,
          file: (asset as any).file 
        };
        
        processUpload(normalizedAsset);
      }
    } catch (err) {
      console.error("Errore fotocamera:", err);
    }
  };

  return (
    <View className="mb-8 relative">
      <Text className="text-slate-700 dark:text-slate-300 font-semibold mb-2 ml-1">Allegato (Scontrino/Bolletta)</Text>
      
      {fileCaricato ? (
        <View className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-3 flex-row items-center justify-between">
          <View className="flex-row items-center flex-1 pr-2">
            <FileText size={20} color="#3b82f6" />
            <View className="ml-3 flex-1">
              <Text className="text-blue-900 dark:text-blue-100 font-semibold text-sm" numberOfLines={1}>
                {fileCaricato}
              </Text>
              
              {ocrStatus === 'processing' && (
                <View className="flex-row items-center mt-1">
                  <ActivityIndicator size="small" color="#3b82f6" />
                  <Text className="text-xs text-blue-600 dark:text-blue-400 ml-2">Estrazione dati OCR in corso...</Text>
                </View>
              )}
              {ocrStatus === 'done' && (
                <View className="flex-row items-center mt-1">
                  <CheckCircle size={14} color="#10b981" />
                  <Text className="text-xs text-emerald-600 dark:text-emerald-400 ml-1">Allegato presente nel database</Text>
                </View>
              )}
            </View>
          </View>
          
          <TouchableOpacity 
            onPress={() => { 
              setFileCaricato(null); 
              setOcrStatus('idle'); 
              onDocumentUploaded(null);
            }}
            disabled={ocrStatus === 'processing' || uploading}
            className="p-1"
          >
            <X size={20} color={(ocrStatus === 'processing' || uploading) ? "#94a3b8" : "#3b82f6"} />
          </TouchableOpacity>
        </View>
      ) : (
        <View className="flex-row justify-between gap-3">
          <TouchableOpacity 
            onPress={takePhoto}
            disabled={uploading}
            className="flex-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-5 px-2 items-center justify-center shadow-sm"
          >
            <View className="bg-blue-50 dark:bg-blue-900/30 p-3 rounded-full mb-2">
              <Camera size={26} color="#3b82f6" />
            </View>
            <Text className="text-slate-700 dark:text-slate-300 font-medium text-sm text-center">Scatta Foto</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={pickDocument}
            disabled={uploading}
            className="flex-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-5 px-2 items-center justify-center shadow-sm"
          >
            <View className="bg-blue-50 dark:bg-blue-900/30 p-3 rounded-full mb-2">
              <Paperclip size={26} color="#3b82f6" />
            </View>
            <Text className="text-slate-700 dark:text-slate-300 font-medium text-sm text-center">Scegli File</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Overlay di caricamento trasparente che blocca i tap multipli */}
      {uploading && (
        <View className="absolute inset-0 bg-white/70 dark:bg-slate-900/70 rounded-xl items-center justify-center z-10">
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text className="text-blue-600 font-bold mt-2">Caricamento in corso...</Text>
        </View>
      )}
    </View>
  );
}