/**
 * Componente de formulário de perfil
 */

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { perfilFormSchema, PerfilFormValues } from '../../schemas';
import { usePerfil } from '../../hooks';
import { 
  Button,
  Card,
  Input,
  Select,
  Checkbox,
  Textarea,
  Label,
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from '@/shared/components/ui';
import { LoadingSpinner } from '@/shared/components/ui/loading-spinner';

export interface PerfilFormProps {
  onSuccess?: () => void;
}

export const PerfilForm: React.FC<PerfilFormProps> = ({ onSuccess }) => {
  const { 
    perfil, 
    interesses, 
    isLoadingPerfil, 
    isUpdatingPerfil, 
    atualizarPerfil,
    perfilError
  } = usePerfil();

  const form = useForm<PerfilFormValues>({
    resolver: zodResolver(perfilFormSchema),
    defaultValues: {
      displayName: perfil?.displayName || '',
      email: perfil?.email || '',
      bio: perfil?.bio || '',
      location: perfil?.location || '',
      interests: perfil?.interests || [],
      notifications: perfil?.notifications || {
        email: true,
        push: true,
        sms: false
      }
    }
  });

  const onSubmit = (data: PerfilFormValues) => {
    atualizarPerfil(data, {
      onSuccess: () => {
        onSuccess?.();
      }
    });
  };

  if (isLoadingPerfil) {
    return (
      <Card className="p-6 flex justify-center items-center">
        <LoadingSpinner />
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h2 className="text-2xl font-bold mb-6">Seu Perfil</h2>

      {perfilError && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
          Ocorreu um erro ao carregar o perfil. Por favor, tente novamente.
        </div>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="displayName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Seu nome" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input {...field} type="email" placeholder="seu@email.com" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="bio"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Biografia</FormLabel>
                <FormControl>
                  <Textarea 
                    {...field} 
                    placeholder="Conte um pouco sobre você" 
                    rows={4}
                  />
                </FormControl>
                <FormDescription>
                  Máximo de 500 caracteres
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="location"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Localização</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Cidade, UF" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="space-y-3">
            <Label>Notificações</Label>
            
            <FormField
              control={form.control}
              name="notifications.email"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md p-2">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Email</FormLabel>
                    <FormDescription>
                      Receber notificações por email
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="notifications.push"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md p-2">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Push</FormLabel>
                    <FormDescription>
                      Receber notificações push
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="notifications.sms"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md p-2">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>SMS</FormLabel>
                    <FormDescription>
                      Receber notificações por SMS
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
          </div>

          <div className="flex justify-end space-x-4 pt-4">
            <Button type="button" variant="outline">
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={isUpdatingPerfil}
            >
              {isUpdatingPerfil ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Salvando...
                </>
              ) : 'Salvar Alterações'}
            </Button>
          </div>
        </form>
      </Form>
    </Card>
  );
};