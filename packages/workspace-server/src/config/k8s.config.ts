export interface K8sConfig {
  kubeConfig?: string;
  namespace?: string;
  ingressHost?: string;
}

export const defaultK8sConfig: K8sConfig = {
  namespace: 'default',
  ingressHost: 'workspace.com'
}; 