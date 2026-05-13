import { View, Text, Alert } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { SocialConnections } from '@/components/social-connections';
import { useAuth } from '@/context/AuthContext';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useState } from 'react';


const registerSchema = z.object ({
  nome: z.string().min(2, 'Il nome deve avere almeno 2 caratteri'),
  cognome: z.string().min(2, 'Il cognome deve avere almeno 2 caratteri'),
  email: z.string().email('Inserisci un indirizzo email valido'),
  password: z.string().min(8, 'La password deve avere almeno 8 caratteri'),
})

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterScreen() {
  const router = useRouter();
  const { register, isLoading } = useAuth();
  const [serverError, setServerError] = useState('');

  const { control, handleSubmit, formState: { errors } } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { nome: '', cognome: '', email: '', password: '' }
  });

  const onSubmit = async (data: RegisterFormData) => {
    setServerError('');
    const success = await register(data);

    if (success) {
      router.replace('/(auth)'); 
    } else {
      setServerError('Errore dal server. L\'email potrebbe essere già in uso.');
    }
  };
  

  return (
    <View className="flex-1 justify-center items-center bg-gray-50 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Registrati</CardTitle>
          <CardDescription className="text-center">
            Crea un account per unirti al tuo appartamento.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Nome e Cognome affiancati */}
          <View className="flex-row gap-4">
            <View className="flex-1 space-y-2">
              <Label nativeID="nome">Nome</Label>
              <Controller
                control={control}
                name="nome"
                render={({ field: { onChange, value } }) => (
                  <Input 
                    id="nome" 
                    placeholder="Mario" 
                    value={value} 
                    onChangeText={onChange} 
                  />
                )}
              />
              {errors.nome && <Text className="text-red-500 text-xs">{errors.nome.message}</Text>}
            </View>

            <View className="flex-1 space-y-2">
              <Label nativeID="cognome">Cognome</Label>
              <Controller
                control={control}
                name="cognome"
                render={({ field: { onChange, value } }) => (
                  <Input 
                    id="cognome" 
                    placeholder="Rossi" 
                    value={value} 
                    onChangeText={onChange} 
                  />
                )}
              />
              {errors.cognome && <Text className="text-red-500 text-xs">{errors.cognome.message}</Text>}
            </View>
          </View>
          
          <View className="space-y-2">
            <Label nativeID="email">Email</Label>
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

          {serverError ? <Text className="text-red-500 text-center font-semibold mt-2">{serverError}</Text> : null}

        </CardContent>
        
        <CardFooter className="flex-col gap-3">
          <Button className="w-full" onPress={handleSubmit(onSubmit)} disabled={isLoading}>
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
            <Text className="text-gray-600">
              Hai già un account? <Text className="underline font-bold">Accedi</Text>
            </Text>
          </Button>

          <View className="flex-row items-center my-4">
            <View 
              className="flex-1 h-px bg-gray-300 dark:bg-gray-700" 
              style={{ height: 1, backgroundColor: '#D1D5DB' }} 
            />
            
            <Text className="mx-4 text-xs font-semibold text-gray-500 uppercase">
              Oppure
            </Text>
            
            <View 
              className="flex-1 h-px bg-gray-300 dark:bg-gray-700" 
              style={{ height: 1, backgroundColor: '#D1D5DB' }} 
            />
          </View>

          <SocialConnections />
        </CardFooter>
      </Card>
    </View>
  );
}