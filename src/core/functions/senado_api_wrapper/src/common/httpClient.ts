import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';

/**
 * Configurações para o cliente HTTP.
 */
export interface HttpClientConfig {
  baseURL: string;
  timeout?: number;
  headers?: Record<string, string>;
}

/**
 * Cliente HTTP genérico para fazer requisições à API.
 */
export class HttpClient {
  private instance: AxiosInstance;

  constructor(config: HttpClientConfig) {
    this.instance = axios.create({
      baseURL: config.baseURL,
      timeout: config.timeout || 10000, // 10 segundos de timeout padrão
      headers: {
        'Accept': 'application/json', // Por padrão, aceita JSON
        ...(config.headers || {}),
      },
    });

    this.initializeInterceptors();
  }

  private initializeInterceptors() {
    this.instance.interceptors.response.use(
      (response: AxiosResponse) => response.data, // Retorna diretamente os dados da resposta
      (error: AxiosError) => {
        // Aqui pode-se adicionar um tratamento de erro mais robusto no futuro
        // Por exemplo, logar o erro, transformar o erro em um formato padrão, etc.
        console.error('Erro na requisição HTTP:', error.config?.url, error.message, error.response?.status);
        return Promise.reject(error);
      }
    );
  }

  /**
   * Realiza uma requisição GET.
   * @param url - O caminho do endpoint.
   * @param config - Configurações adicionais da requisição (ex: params).
   */
  public async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.instance.get<T, T>(url, config);
  }

  /**
   * Realiza uma requisição POST.
   * @param url - O caminho do endpoint.
   * @param data - O corpo da requisição.
   * @param config - Configurações adicionais da requisição.
   */
  public async post<T = any, R = any>(url: string, data?: T, config?: AxiosRequestConfig): Promise<R> {
    return this.instance.post<T, R>(url, data, config);
  }

  /**
   * Realiza uma requisição PUT.
   * @param url - O caminho do endpoint.
   * @param data - O corpo da requisição.
   * @param config - Configurações adicionais da requisição.
   */
  public async put<T = any, R = any>(url: string, data?: T, config?: AxiosRequestConfig): Promise<R> {
    return this.instance.put<T, R>(url, data, config);
  }

  /**
   * Realiza uma requisição DELETE.
   * @param url - O caminho do endpoint.
   * @param config - Configurações adicionais da requisição.
   */
  public async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.instance.delete<T, T>(url, config);
  }
}

