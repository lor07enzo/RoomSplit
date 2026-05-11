import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useColorScheme } from 'nativewind';
import { Image, Platform, View, Text } from 'react-native';

const SOCIAL_CONNECTION_STRATEGIES = [
  {
    type: 'oauth_google',
    source: { uri: 'https://img.clerk.com/static/google.png?width=160' },
    useTint: false,
    label: 'Continua con Google',
  },
];

export function SocialConnections() {
  const { colorScheme } = useColorScheme();

  return (
    <View className="w-full gap-2 sm:flex-row sm:gap-3">
      {SOCIAL_CONNECTION_STRATEGIES.map((strategy) => {
        return (
          <Button
            key={strategy.type}
            variant="outline"
            className="w-full flex-row items-center justify-center gap-2"
            onPress={() => {
              // TODO: Authenticate with social provider
              console.log('Login con Google');
            }}>
            
            <Image
              className={cn('w-5 h-5', strategy.useTint && Platform.select({ web: 'dark:invert' }))}
              resizeMode="contain"
              tintColor={Platform.select({
                native: strategy.useTint ? (colorScheme === 'dark' ? 'white' : 'black') : undefined,
              })}
              source={strategy.source}
            />
            
            <Text className="text-sm font-medium text-gray-800 dark:text-gray-200">
              {strategy.label}
            </Text>
            
          </Button>
        );
      })}
    </View>
  );
}