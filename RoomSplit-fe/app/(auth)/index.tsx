import { View, Text } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { SocialConnections } from '@/components/social-connections';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
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
    <View className="flex-1 justify-center items-center bg-gray-50 p-4">
      
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">RoomSplit</CardTitle>
          <CardDescription className="text-center">
            Bentornato! Accedi al tuo appartamento.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">

          {/* ALERT DI SUCCESSO */}
          {successMessage ? (
            <Alert className="border-green-500 bg-green-50 dark:bg-green-900/20">
              {/* Riga flessibile per allineare icona e titolo */}
              <View className="flex-row items-center gap-2 mb-1">
                <CheckCircle2 size={20} color="#15803d" />
                <AlertTitle className="text-green-700 dark:text-green-400 m-0">
                  Successo
                </AlertTitle>
              </View>
              <AlertDescription className="text-green-600 dark:text-green-300 mt-1">
                {successMessage}
              </AlertDescription>
            </Alert>
          ) : null}

          {/* ALERT DI ERRORE */}
          {serverError ? (
             <Alert variant="destructive">
               <View className="flex-row items-center gap-2 mb-1">
                 <AlertCircle size={20} color="#dc2626" />
                 <AlertTitle className="m-0">Errore</AlertTitle>
               </View>
               <AlertDescription className="mt-1">
                 {serverError}
               </AlertDescription>
             </Alert>
          ) : null}

          <View className="space-y-2">
            <Label nativeID="email">Email</Label>
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
                />
              )}
            />
            {errors.email && <Text className="text-red-500 text-xs">{errors.email.message}</Text>}
          </View>
          
          <View className="space-y-2">
            <Label nativeID="password">Password</Label>
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
                />
              )}
            />
            {errors.password && <Text className="text-red-500 text-xs">{errors.password.message}</Text>}
          </View>
        </CardContent>
        
        <CardFooter className="flex-col gap-3">
          <Button className="w-full" onPress={handleSubmit(onSubmit)} disabled={isLoading}>
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
            <Text className="text-gray-600">
              Non hai un account? <Text className="underline font-bold">Registrati</Text>
            </Text>
          </Button>

          <View className="flex-row items-center my-4">
            <View className="flex-1 h-px bg-gray-300 dark:bg-gray-700" style={{ height: 1, backgroundColor: '#D1D5DB' }} />
            <Text className="mx-4 text-xs font-semibold text-gray-500 uppercase">Oppure</Text>
            <View className="flex-1 h-px bg-gray-300 dark:bg-gray-700" style={{ height: 1, backgroundColor: '#D1D5DB' }} />
          </View>

          <SocialConnections />
        </CardFooter>
      </Card>
      
    </View>
  );
}