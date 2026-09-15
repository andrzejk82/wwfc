import {it,expect} from 'vitest';
import {validateCallbackResult} from '../../scripts/callback-result.mjs';
it('allows a duplicate matching terminal state but rejects contradictory callback outcomes',()=>{
 expect(validateCallbackResult({accepted:false,status:{phase:'succeeded'}},'succeeded')).toBe(false);
 expect(()=>validateCallbackResult({accepted:false,status:{phase:'failed'}},'succeeded')).toThrow();
 expect(()=>validateCallbackResult({accepted:true,status:{phase:'running'}},'failed')).toThrow();
 expect(()=>validateCallbackResult({},'running')).toThrow();
 expect(validateCallbackResult({accepted:false,status:{phase:'running'}},'running')).toBe(false);
});
