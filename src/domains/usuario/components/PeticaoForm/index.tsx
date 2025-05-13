/**
 * Componente de formulário de petição
 */

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { peticaoFormSchema, PeticaoFormValues } from '../../schemas';
import { usePeticaoActions } from '../../hooks';
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

export interface PeticaoFormProps {
  onSuccess?: () => void;
}

export const PeticaoForm: React.FC<PeticaoFormProps> = ({ onSuccess }) => {
  const { criarPeticao, isCreating, createError } = usePeticaoActions();

  const form = useForm<PeticaoFormValues>({
    resolver: zodResolver(peticaoFormSchema),
    defaultValues: {
      titulo: '',
      descricao: '',
      categoria: 'outros',
      tags: [],
      termos: false
    }
  });

  const onSubmit = (data: PeticaoFormValues) => {
    criarPeticao(data, {
      onSuccess: () => {
        form.reset();
        onSuccess?.();
      }
    });
  };

  return (
    <Card className="p-6">
      <h2 className="text-2xl font-bold mb-6">Criar Nova Petição</h2>

      {createError && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
          Ocorreu um erro ao criar a petição. Por favor, tente novamente.
        </div>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="titulo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Título</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Título da petição" />
                </FormControl>
                <FormDescription>
                  Entre 10 e 100 caracteres
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="descricao"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Descrição</FormLabel>
                <FormControl>
                  <Textarea 
                    {...field} 
                    placeholder="Descreva o objetivo da petição" 
                    rows={6}
                  />
                </FormControl>
                <FormDescription>
                  Entre 50 e 2000 caracteres
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="categoria"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Categoria</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <Select.Trigger>
                      <Select.Value placeholder="Selecione uma categoria" />
                    </Select.Trigger>
                  </FormControl>
                  <Select.Content>
                    <Select.Item value="educacao">Educação</Select.Item>
                    <Select.Item value="saude">Saúde</Select.Item>
                    <Select.Item value="seguranca">Segurança</Select.Item>
                    <Select.Item value="meio_ambiente">Meio Ambiente</Select.Item>
                    <Select.Item value="direitos_humanos">Direitos Humanos</Select.Item>
                    <Select.Item value="economia">Economia</Select.Item>
                    <Select.Item value="infraestrutura">Infraestrutura</Select.Item>
                    <Select.Item value="outros">Outros</Select.Item>
                  </Select.Content>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="termos"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md p-2">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Termos e Condições</FormLabel>
                  <FormDescription>
                    Concordo com os termos e condições da plataforma
                  </FormDescription>
                  <FormMessage />
                </div>
              </FormItem>
            )}
          />

          <div className="flex justify-end space-x-4 pt-4">
            <Button type="button" variant="outline">
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={isCreating}
            >
              {isCreating ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Criando...
                </>
              ) : 'Criar Petição'}
            </Button>
          </div>
        </form>
      </Form>
    </Card>
  );
};