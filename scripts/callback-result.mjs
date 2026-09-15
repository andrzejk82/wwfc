export function validateCallbackResult(result, phase) {
 if(typeof result?.accepted !== 'boolean' || (phase !== 'running' && result.status?.phase !== phase)) {
  throw new Error('Koordynator nie potwierdził oczekiwanego stanu publikacji.');
 }
 return result.accepted;
}
