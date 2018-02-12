export function stringToTypedArray(string) {
  const array = new Uint8Array(string.length);
  for (let i = 0; i < string.length; i ++) {
    array[i] = string.charCodeAt(i);
  }
  return array;
}

export function typedArrayToString(array) {
  let string = '';
  for (let i = 0; i < array.length; i ++) {
    string += String.fromCharCode(array[i]);
  }
  return string;
}
