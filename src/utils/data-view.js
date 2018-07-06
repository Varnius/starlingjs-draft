export function getDataViewOfLength(capacity) {
  return new DataView(new ArrayBuffer(capacity))
}

export function copyFromDataView(
  source,
  target,
  sourceStartPos = 0,
  numBytes = -1,
  targetStartPos = 0
) {
  let numBytesToCopy =
    numBytes !== -1 ? numBytes : source.byteLength - sourceStartPos
  let targetPos = targetStartPos
  let sourcePos = sourceStartPos

  if (targetStartPos + numBytesToCopy >= target.byteLength) {
    target = getExtendedDataView(target, numBytes)
  }

  while (numBytesToCopy > 0) {
    target.setUint32(targetPos, source.getUint32(sourcePos))
    targetPos += 4
    sourcePos += 4
    numBytesToCopy -= 4
  }

  return target
}

export function getExtendedDataView(target, numBytes) {
  const result = getDataViewOfLength(target.byteLength + numBytes)
  copyFromDataView(target, result)
  return result
}
