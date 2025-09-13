const moment = require('moment');

// Configurar moment para português brasileiro
moment.locale('pt-br');

class Helpers {
  // Formatar data para exibição
  static formatDate(date, format = 'DD/MM/YYYY HH:mm') {
    return moment(date).format(format);
  }

  // Formatar data relativa (ex: "há 2 horas")
  static formatRelativeDate(date) {
    return moment(date).fromNow();
  }

  // Validar se string é um email válido
  static isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Validar se string é um telefone brasileiro válido
  static isValidPhone(phone) {
    const phoneRegex = /^\(?[1-9]{2}\)?\s?[0-9]{4,5}-?[0-9]{4}$/;
    return phoneRegex.test(phone);
  }

  // Limpar string removendo caracteres especiais
  static sanitizeString(str) {
    return str.replace(/[<>]/g, '').trim();
  }

  // Gerar slug a partir de string
  static generateSlug(str) {
    return str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim('-');
  }

  // Truncar texto
  static truncateText(text, maxLength = 100) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  }

  // Capitalizar primeira letra
  static capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  }

  // Gerar código aleatório
  static generateRandomCode(length = 6) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  // Validar força da senha
  static validatePasswordStrength(password) {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[@$!%*?&]/.test(password);

    const score = [
      password.length >= minLength,
      hasUpperCase,
      hasLowerCase,
      hasNumbers,
      hasSpecialChar
    ].filter(Boolean).length;

    let strength = 'fraca';
    if (score >= 4) strength = 'forte';
    else if (score >= 3) strength = 'média';

    return {
      score,
      strength,
      isValid: score >= 3,
      details: {
        minLength: password.length >= minLength,
        hasUpperCase,
        hasLowerCase,
        hasNumbers,
        hasSpecialChar
      }
    };
  }

  // Calcular idade a partir da data de nascimento
  static calculateAge(birthDate) {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  }

  // Verificar se data está no futuro
  static isFutureDate(date) {
    return new Date(date) > new Date();
  }

  // Verificar se data está no passado
  static isPastDate(date) {
    return new Date(date) < new Date();
  }

  // Converter bytes para formato legível
  static formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  // Gerar cor aleatória em hexadecimal
  static generateRandomColor() {
    return '#' + Math.floor(Math.random() * 16777215).toString(16);
  }

  // Verificar se string contém apenas números
  static isNumeric(str) {
    return /^\d+$/.test(str);
  }

  // Remover acentos de string
  static removeAccents(str) {
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  // Verificar se array está vazio
  static isEmpty(array) {
    return !array || array.length === 0;
  }

  // Verificar se objeto está vazio
  static isEmptyObject(obj) {
    return !obj || Object.keys(obj).length === 0;
  }

  // Delay assíncrono
  static delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Retry com backoff exponencial
  static async retryWithBackoff(fn, maxRetries = 3, baseDelay = 1000) {
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn();
      } catch (error) {
        if (i === maxRetries - 1) throw error;
        await this.delay(baseDelay * Math.pow(2, i));
      }
    }
  }

  // Validar URL
  static isValidUrl(string) {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  }

  // Extrair domínio de URL
  static extractDomain(url) {
    try {
      return new URL(url).hostname;
    } catch (_) {
      return null;
    }
  }

  // Gerar hash simples
  static simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36);
  }
}

module.exports = Helpers;
