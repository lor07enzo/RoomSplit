import { View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useState } from 'react';
import { AlertCircle, CheckCircle2 } from 'lucide-react-native';

const registerSchema = z.object({
  nome: z.string().min(2, 'Il nome deve avere almeno 2 caratteri'),
  cognome: z.string().min(2, 'Il cognome deve avere almeno 2 caratteri'),
  email: z.string().email('Inserisci un indirizzo email valido'),
  password: z.string().min(8, 'La password deve avere almeno 8 caratteri'),
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterScreen() {
  const router = useRouter();
  const { register, isLoading } = useAuth();
  const [serverError, setServerError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const { control, handleSubmit, formState: { errors } } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { nome: '', cognome: '', email: '', password: '' }
  });

  const onSubmit = async (data: RegisterFormData) => {
    setServerError('');
    setSuccessMessage('');
    const success = await register(data);

    if (success) {
      setSuccessMessage('Registrazione avvenuta con successo!');
      setTimeout(() => {
        router.replace('/(auth)');
      }, 1500);
    } else {
      setServerError('Errore dal server. L\'email potrebbe essere già in uso.');
    }
  };

  return (
    <View className="flex-1 justify-center items-center bg-slate-50 dark:bg-slate-900 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center dark:text-white">Registrati</CardTitle>
          <CardDescription className="text-center dark:text-slate-400">
            Crea un account per unirti al tuo appartamento.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* ALERT DI SUCCESSO */}
          {successMessage ? (
            <View className="bg-emerald-50 border border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/30 rounded-xl p-3 flex-row items-start shadow-sm">
              <CheckCircle2 size={20} color="#10b981" className="mt-0.5 flex-shrink-0" />
              
              <View className="flex-1 ml-3">
                <Text className="text-emerald-800 dark:text-emerald-400 font-bold text-sm">
                  Registrazione Riuscita
                </Text>
                <Text className="text-emerald-600 dark:text-emerald-300 mt-0.5 text-xs leading-4">
                  {successMessage}
                </Text>
              </View>
            </View>
          ) : null}

          {/* ALERT DI ERRORE */}
          {serverError ? (
             <View className="bg-red-50 border border-red-200 dark:bg-red-500/10 dark:border-red-500/30 rounded-xl p-3 flex-row items-start shadow-sm">
               <AlertCircle size={20} color="#ef4444" className="mt-0.5 flex-shrink-0" />
               
               <View className="flex-1 ml-3">
                 <Text className="text-red-800 dark:text-red-400 font-bold text-sm">
                   Registrazione Fallita
                 </Text>
                 <Text className="text-red-600 dark:text-red-300 mt-0.5 text-xs leading-4">
                   {serverError}
                 </Text>
               </View>
             </View>
          ) : null}
          
          <View className="flex-row gap-4">
            <View className="flex-1 space-y-2">
              <Label nativeID="nome" className="dark:text-slate-300">Nome</Label>
              <Controller
                control={control}
                name="nome"
                render={({ field: { onChange, value } }) => (
                  <Input 
                    id="nome" 
                    placeholder="Mario" 
                    value={value} 
                    onChangeText={onChange} 
                    className="dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                  />
                )}
              />
              {errors.nome && <Text className="text-red-500 dark:text-red-400 text-xs">{errors.nome.message}</Text>}
            </View>

            <View className="flex-1 space-y-2">
              <Label nativeID="cognome" className="dark:text-slate-300">Cognome</Label>
              <Controller
                control={control}
                name="cognome"
                render={({ field: { onChange, value } }) => (
                  <Input 
                    id="cognome" 
                    placeholder="Rossi" 
                    value={value} 
                    onChangeText={onChange} 
                    className="dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                  />
                )}
              />
              {errors.cognome && <Text className="text-red-500 dark:text-red-400 text-xs">{errors.cognome.message}</Text>}
            </View>
          </View>
          
          <View className="space-y-2">
            <Label nativeID="email" className="dark:text-slate-300">Email</Label>
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, value } }) => (
                <Input 
                  id="email" 
                  placeholder="mario@email.com" 
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={value} 
                  onChangeText={onChange} 
                  className="dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                />
              )}
            />
            {errors.email && <Text className="text-red-500 dark:text-red-400 text-xs">{errors.email.message}</Text>}
          </View>
          
          <View className="space-y-2">
            <Label nativeID="password" className="dark:text-slate-300">Password</Label>
            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, value } }) => (
                <Input 
                  id="password" 
                  placeholder="••••••••" 
                  secureTextEntry 
                  value={value} 
                  onChangeText={onChange} 
                  className="dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                />
              )}
            />
            {errors.password && <Text className="text-red-500 dark:text-red-400 text-xs">{errors.password.message}</Text>}
          </View>
        </CardContent>
        
        <CardFooter className="flex-col gap-3">
          <Button 
            className="w-full bg-blue-600 dark:bg-blue-500 active:bg-blue-700 dark:active:bg-blue-600 py-3 rounded-xl shadow-sm" 
            onPress={handleSubmit(onSubmit)} 
            disabled={isLoading}
          >
            <Text className="text-white font-semibold">
              {isLoading ? 'Creazione in corso...' : 'Crea Account'}
            </Text>
          </Button>
          
          <Button 
            variant="ghost" 
            className="w-full" 
            onPress={() => router.replace('/(auth)')}
            disabled={isLoading}
          >
            <Text className="text-slate-600 dark:text-slate-400">
              Hai già un account? <Text className="underline font-bold text-slate-900 dark:text-white">Accedi</Text>
            </Text>
          </Button>

          {/* <View className="flex-row items-center my-4">
            <View className="flex-1 h-[1px] bg-slate-300 dark:bg-slate-700" />
            <Text className="mx-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">
              Oppure
            </Text>
            <View className="flex-1 h-[1px] bg-slate-300 dark:bg-slate-700" />
          </View>

          <SocialConnections /> */}
        </CardFooter>
      </Card>
    </View>
  );
}