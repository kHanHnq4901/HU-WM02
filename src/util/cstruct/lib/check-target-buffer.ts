import checkOffset from './check-offset';
import { Buffer } from 'buffer';

function checkTargetBuffer(targetBuffer, targetOffset, byteLength) {
  if (targetBuffer) {
    checkOffset(targetOffset, byteLength, targetBuffer.length);
    return { buffer: targetBuffer, offset: targetOffset };
  } else {
    return { buffer: Buffer.alloc(byteLength), offset: 0 };
  }
}

export default checkTargetBuffer;
