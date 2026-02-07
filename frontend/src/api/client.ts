import type {
  ResearchRequest,
  ResearchBundle,
  ReportGenerateRequest,
  Report,
  AttackTechnique,
  ApiError,
} from '../types';

const API_BASE = '/api';

class ApiClient {
  private async request<T>(
    path: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE}${path}`;
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      let errorDetail = `HTTP ${response.status}`;
      try {
        const errorBody: ApiError = await response.json();
        errorDetail = errorBody.detail || errorDetail;
      } catch {
        // response wasn't JSON
      }
      throw new Error(errorDetail);
    }

    return response.json();
  }

  async research(request: ResearchRequest): Promise<ResearchBundle> {
    return this.request<ResearchBundle>('/research', {
      method: 'POST',
      body: JSON.stringify({
        topic: request.topic,
        tier: request.tier,
        api_keys: request.apiKeys,
      }),
    });
  }

  async generateReport(request: ReportGenerateRequest): Promise<Report> {
    return this.request<Report>('/report/generate', {
      method: 'POST',
      body: JSON.stringify({
        bundle: request.bundle,
        settings: request.settings,
      }),
    });
  }

  async lookupTechnique(query: string): Promise<AttackTechnique[]> {
    return this.request<AttackTechnique[]>(
      `/attack/lookup?q=${encodeURIComponent(query)}`
    );
  }

  async generateNavigatorLayer(
    techniques: AttackTechnique[]
  ): Promise<Record<string, unknown>> {
    return this.request<Record<string, unknown>>('/attack/navigator', {
      method: 'POST',
      body: JSON.stringify({ techniques }),
    });
  }

  async exportHtml(report: Report): Promise<string> {
    const url = `${API_BASE}/export/html`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(report),
    });

    if (!response.ok) {
      let errorDetail = `HTTP ${response.status}`;
      try {
        const errorBody: ApiError = await response.json();
        errorDetail = errorBody.detail || errorDetail;
      } catch {
        // response wasn't JSON
      }
      throw new Error(errorDetail);
    }

    return response.text();
  }

  async exportPdf(report: Report): Promise<Blob> {
    const response = await fetch(`${API_BASE}/export/pdf`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(report),
    });
    if (!response.ok) throw new Error('PDF export failed');
    return response.blob();
  }

  async exportMarkdown(report: Report): Promise<string> {
    const url = `${API_BASE}/export/markdown`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(report),
    });

    if (!response.ok) {
      let errorDetail = `HTTP ${response.status}`;
      try {
        const errorBody: ApiError = await response.json();
        errorDetail = errorBody.detail || errorDetail;
      } catch {
        // response wasn't JSON
      }
      throw new Error(errorDetail);
    }

    // Backend returns PlainTextResponse, not JSON
    return response.text();
  }

  async healthCheck(): Promise<{ status: string; version: string }> {
    return this.request<{ status: string; version: string }>('/health');
  }
}

export const apiClient = new ApiClient();
