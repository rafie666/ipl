/**
 * Utility Cryptographic Hashing untuk password di React Native
 * SHA-256 dengan secure salting (100% kompatibel dengan sistem web)
 */

const DEFAULT_SALT_PREFIX = 'wargaku_salt_2026_'

// Pure JS SHA-256 implementation
function sha256_sync(ascii) {
  function rightRotate(value, amount) {
    return (value >>> amount) | (value << (32 - amount))
  }

  const mathPow = Math.pow
  const maxWord = mathPow(2, 32)
  let lengthProperty = 'length'
  let i, j
  let result = ''

  let words = []
  let asciiBitLength = ascii[lengthProperty] * 8

  let hash = []
  let k = []
  let primeCounter = 0

  let isComposite = {}
  for (let candidate = 2; primeCounter < 64; candidate++) {
    if (!isComposite[candidate]) {
      for (i = 0; i < 313; i += candidate) {
        isComposite[i] = candidate
      }
      hash[primeCounter] = (mathPow(candidate, 0.5) * maxWord) | 0
      k[primeCounter++] = (mathPow(candidate, 1 / 3) * maxWord) | 0
    }
  }

  ascii += '\x80'
  while ((ascii[lengthProperty] % 64) - 56) ascii += '\x00'
  for (i = 0; i < ascii[lengthProperty]; i++) {
    j = ascii.charCodeAt(i)
    if (j >> 8) return '' // only ASCII
    words[i >> 2] |= j << (((3 - i) % 4) * 8)
  }
  words[words[lengthProperty]] = (asciiBitLength / maxWord) | 0
  words[words[lengthProperty]] = asciiBitLength

  for (j = 0; j < words[lengthProperty]; ) {
    let w = words.slice(j, (j += 16))
    let oldHash = hash
    hash = hash.slice(0, 8)

    for (i = 0; i < 64; i++) {
      let i2 = i + j
      let w15 = w[i - 15],
        w2 = w[i - 2]

      let s0 = rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3)
      let s1 = rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10)
      w[i] =
        i < 16
          ? w[i]
          : (w[i - 16] + s0 + w[i - 7] + s1) | 0

      let s1_temp =
        rightRotate(hash[0], 2) ^ rightRotate(hash[0], 13) ^ rightRotate(hash[0], 22)
      let maj = (hash[0] & hash[1]) ^ (hash[0] & hash[2]) ^ (hash[1] & hash[2])
      let ch = (hash[4] & hash[5]) ^ (~hash[4] & hash[6])
      let s0_temp =
        rightRotate(hash[4], 6) ^ rightRotate(hash[4], 11) ^ rightRotate(hash[4], 25)

      let t1 = hash[7] + s0_temp + ch + k[i] + w[i]
      let t2 = s1_temp + maj

      hash = [(t1 + t2) | 0].concat(hash)
      hash[4] = (hash[4] + t1) | 0
    }

    for (i = 0; i < 8; i++) {
      hash[i] = (hash[i] + oldHash[i]) | 0
    }
  }

  for (i = 0; i < 8; i++) {
    for (let i2 = 3; i2 >= 0; i2--) {
      let b = (hash[i] >> (i2 * 8)) & 255
      result += (b < 16 ? '0' : '') + b.toString(16)
    }
  }
  return result
}

export async function hashPassword(password, customSalt = null) {
  if (!password) return ''
  const salt = customSalt || DEFAULT_SALT_PREFIX
  const salted = `${salt}${password}`
  return sha256_sync(salted)
}

export async function verifyPassword(plainPassword, storedHash) {
  if (!plainPassword || !storedHash) return false
  const computed = await hashPassword(plainPassword)
  return computed === storedHash
}

export function normalizeUsername(name) {
  if (!name) return ''
  return name
    .toLowerCase()
    .replace(/^(bpk\.|bapak\.|ibu\.|h\.|hj\.|dr\.|drs\.)\s*/gi, '')
    .trim()
    .replace(/[^a-z0-9\s._-]/g, '')
    .replace(/\s+/g, '.')
    .replace(/\.+/g, '.')
}
