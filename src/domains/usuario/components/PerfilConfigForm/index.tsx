/**
 * Componente de formulário de configurações do perfil
 */

import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { perfilConfigSchema, PerfilConfigValues } from '../../schemas';
import { usePerfil } from '../../hooks';
import { todosEstados } from '@/domains/congresso/components/Dashboards/dashboardConfig';

// Importar componentes UI
import { Button } from '@/shared/components/ui/button';
import { Card } from '@/shared/components/ui/card';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/shared/components/ui/select';
import { 
  RadioGroup,
  RadioGroupItem
} from '@/shared/components/ui/input';
import { Switch } from '@/shared/components/ui/input';
import { LoadingSpinner } from '@/shared/components/ui/loading-spinner';

// Importar componentes de formulário
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage
} from '@/shared/components/form';

export interface PerfilConfigFormProps {
  onSuccess?: () => void;
}

export const PerfilConfigForm: React.FC<PerfilConfigFormProps> = ({ onSuccess }) => {
  const { 
    perfil, 
    isLoadingPerfil, 
    isUpdatingConfig, 
    atualizarConfiguracoes
  } = usePerfil();

  const form = useForm<PerfilConfigValues>({
    resolver: zodResolver(perfilConfigSchema),
    defaultValues: {
      theme: perfil?.theme || 'system',
      language: perfil?.language || 'pt-BR',
      estadoEleitoral: perfil?.estadoEleitoral || 'rj',
      privacy: perfil?.privacy || {
        showEmail: false,
        showLocation: true,
        showInterests: true
      },
      accessibility: perfil?.accessibility || {
        fontSize: 'medium',
        highContrast: false,
        reduceMotion: false
      }
    }
  });

  const onSubmit = (data: PerfilConfigValues) => {
    atualizarConfiguracoes(data, {
      onSuccess: () => {
        // Disparar evento de mudança de estado para atualizar os dashboards
        const stateChangeEvent = new CustomEvent('stateChange', { 
          detail: { 
            code: data.estadoEleitoral,
            name: todosEstados[data.estadoEleitoral] || 'Rio de Janeiro'
          } 
        });
        window.dispatchEvent(stateChangeEvent);
        
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
      <h2 className="text-2xl font-bold mb-6">Configurações</h2>

      <Form {...form} onSubmit={form.handleSubmit(onSubmit)}>
        <div className="space-y-6">
          <Controller
            control={form.control}
            name="theme"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tema</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="flex flex-col space-y-1"
                  >
                    <FormItem className="flex items-center space-x-3 space-y-0">
                      <FormControl>
                        <RadioGroupItem value="light" />
                      </FormControl>
                      <FormLabel className="font-normal">
                        Claro
                      </FormLabel>
                    </FormItem>
                    <FormItem className="flex items-center space-x-3 space-y-0">
                      <FormControl>
                        <RadioGroupItem value="dark" />
                      </FormControl>
                      <FormLabel className="font-normal">
                        Escuro
                      </FormLabel>
                    </FormItem>
                    <FormItem className="flex items-center space-x-3 space-y-0">
                      <FormControl>
                        <RadioGroupItem value="system" />
                      </FormControl>
                      <FormLabel className="font-normal">
                        Sistema
                      </FormLabel>
                    </FormItem>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Controller
            control={form.control}
            name="language"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Idioma</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um idioma" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="pt-BR">Português (Brasil)</SelectItem>
                    <SelectItem value="en-US">English (US)</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <Controller
            control={form.control}
            name="estadoEleitoral"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Estado Eleitoral</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione seu estado" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.entries(todosEstados).map(([uf, nome]) => (
                      <SelectItem key={uf} value={uf}>
                        {nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  Este estado será usado como padrão ao abrir a aplicação
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="space-y-3">
            <h3 className="text-lg font-medium">Privacidade</h3>
            
            <Controller
              control={form.control}
              name="privacy.showEmail"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>Mostrar Email</FormLabel>
                    <FormDescription>
                      Tornar seu email visível para outros usuários
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            
            <Controller
              control={form.control}
              name="privacy.showLocation"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>Mostrar Localização</FormLabel>
                    <FormDescription>
                      Tornar sua localização visível para outros usuários
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
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
              disabled={isUpdatingConfig}
            >
              {isUpdatingConfig ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Salvando...
                </>
              ) : 'Salvar Configurações'}
            </Button>
          </div>
        </div>
      </Form>
    </Card>
  );
};
