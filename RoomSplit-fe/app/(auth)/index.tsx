import { View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { CheckCircle2, AlertCircle } from 'lucide-react-native';

const loginSchema = z.object({
  email: z.string().email('Inserisci un indirizzo email valido'),
  password: z.string().min(1, 'La password è obbligatoria'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginScreen() {
  const router = useRouter();
  const { login, isLoading } = useAuth();
  const [serverError, setServerError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const { control, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' }
  });

  const onSubmit = async (data: LoginFormData) => {
    setServerError('');
    setSuccessMessage('');
    const success = await login(data);

    if (success) {
      setSuccessMessage('Accesso verificato! Ti stiamo reindirizzando...');

      setTimeout(() => {
        router.replace('/(app)/dashboard');
      }, 1500);
    } else {
      setServerError('Credenziali non valide. Riprova.');
    }
  };

  return (
    <View className="flex-1 justify-center items-center bg-slate-50 dark:bg-slate-900 p-4">
      
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center dark:text-white">RoomSplit</CardTitle>
          <CardDescription className="text-center dark:text-slate-400">
            Bentornato! Accedi al tuo appartamento.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">

          {/* ALERT DI SUCCESSO */}
          {successMessage ? (
            <View className="bg-emerald-50 border border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/30 rounded-xl p-3 flex-row items-start shadow-sm">
              {/* flex-shrink-0 impedisce all'icona di schiacciarsi se il testo è lungo */}
              <CheckCircle2 size={20} color="#10b981" className="mt-0.5 flex-shrink-0" />
              
              {/* flex-1 permette al testo di occupare il resto dello spazio e andare a capo */}
              <View className="flex-1 ml-3">
                <Text className="text-emerald-800 dark:text-emerald-400 font-bold text-sm">
                  Accesso Riuscito
                </Text>
                <Text className="text-emerald-600 dark:text-emerald-300 mt-0.5 text-xs leading-4">
                  {successMessage}
                </Text>
              </View>
            </View>
          ) : null}

          {/* ALERT DI ERRORE OTTIMIZZATO */}
          {serverError ? (
             <View className="bg-red-50 border border-red-200 dark:bg-red-500/10 dark:border-red-500/30 rounded-xl p-3 flex-row items-start shadow-sm">
               <AlertCircle size={20} color="#ef4444" className="mt-0.5 flex-shrink-0" />
               
               <View className="flex-1 ml-3">
                 <Text className="text-red-800 dark:text-red-400 font-bold text-sm">
                   Impossibile Accedere
                 </Text>
                 <Text className="text-red-600 dark:text-red-300 mt-0.5 text-xs leading-4">
                   {serverError}
                 </Text>
               </View>
             </View>
          ) : null}

          <View className="space-y-2">
            <Label nativeID="email" className="dark:text-slate-300">Email</Label>
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, value } }) => (
                <Input 
                  id="email" 
                  placeholder="mario.rossi@studenti.unich.it" 
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
              {isLoading ? 'Accesso in corso...' : 'Accedi'}
            </Text>
          </Button>
          
          <Button 
            variant="ghost" 
            className="w-full" 
            onPress={() => router.replace('/(auth)/register')}
            disabled={isLoading}
          >
            <Text className="text-slate-600 dark:text-slate-400">
              Non hai un account? <Text className="underline font-bold text-slate-900 dark:text-white">Registrati</Text>
            </Text>
          </Button>

          {/* <View className="flex-row items-center my-4">
            <View className="flex-1 h-[1px] bg-slate-300 dark:bg-slate-700" />
            <Text className="mx-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Oppure</Text>
            <View className="flex-1 h-[1px] bg-slate-300 dark:bg-slate-700" />
          </View>

          <SocialConnections /> */}
        </CardFooter>
      </Card>
      
    </View>
  );
}