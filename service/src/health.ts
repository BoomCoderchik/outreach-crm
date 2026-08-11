export interface HealthResponse {
  status: 'ok';
  service: 'outreach-crm-local-service';
  version: string;
}

export function createHealthResponse(version: string): HealthResponse {
  return {
    status: 'ok',
    service: 'outreach-crm-local-service',
    version,
  };
}
