export const CLOUDBASE_AUTH_APP_ID = '';
export const ADMIN_ALLOWLIST_COLLECTION = 'admin_allowlist';

const __AUTH_GLOBAL_KEY = '__yinkaojiaoyu_admin_cloudbase_auth__';
const __FORCE_LOGIN_STORAGE_KEY = '__yinkaojiaoyu_admin_force_login__';
const __LOGIN_SESSION_STORAGE_KEY = '__yinkaojiaoyu_admin_login_session__';
const __POST_LOGIN_TO_ADMIN_STORAGE_KEY = '__yinkaojiaoyu_admin_post_login_to_admin__';

const __AUTH_SINGLETON_WM = typeof WeakMap !== 'undefined' ? new WeakMap() : null;

export function getAuthSingleton(tcb) {
  if (!tcb) return null;
  try {
    const cachedFromGlobal = globalThis?.[__AUTH_GLOBAL_KEY];
    if (cachedFromGlobal) {
      try {
        __AUTH_SINGLETON_WM?.set?.(tcb, cachedFromGlobal);
      } catch (e) {}
      return cachedFromGlobal;
    }
  } catch (e) {}
  try {
    const cachedFromWm = __AUTH_SINGLETON_WM?.get?.(tcb);
    if (cachedFromWm) return cachedFromWm;
  } catch (e) {}
  try {
    const cached = tcb?.[__AUTH_GLOBAL_KEY];
    if (cached) return cached;
  } catch (e) {}
  const auth = tcb?.auth?.();
  if (auth) {
    try {
      __AUTH_SINGLETON_WM?.set?.(tcb, auth);
    } catch (e) {}
    try {
      if (!globalThis?.[__AUTH_GLOBAL_KEY]) {
        globalThis[__AUTH_GLOBAL_KEY] = auth;
      }
    } catch (e) {}
    try {
      Object.defineProperty(tcb, __AUTH_GLOBAL_KEY, {
        value: auth,
        writable: false,
        configurable: false
      });
    } catch (e) {
      try {
        tcb[__AUTH_GLOBAL_KEY] = auth;
      } catch (e2) {}
    }
  }
  return auth;
}

function shouldForceLogin() {
  try {
    if (typeof window === 'undefined') return false;
    const sp = new URLSearchParams(window.location.search || '');
    if (sp.get('forceLogin') === '1') {
      return true;
    }
    try {
      if (window?.sessionStorage?.getItem?.(__LOGIN_SESSION_STORAGE_KEY) !== '1') {
        try {
          window.sessionStorage.setItem(__LOGIN_SESSION_STORAGE_KEY, '1');
        } catch (e) {}
        return true;
      }
    } catch (e) {}
    if (window?.sessionStorage?.getItem?.(__FORCE_LOGIN_STORAGE_KEY) === '1') {
      try {
        window.sessionStorage.removeItem(__FORCE_LOGIN_STORAGE_KEY);
      } catch (e) {}
      return true;
    }
    return false;
  } catch (e) {
    return false;
  }
}

function isAnonymousLoginState(loginState) {
  const u = loginState?.user;
  const loginType = loginState?.loginType || loginState?.login_type || loginState?.type || null;
  const provider = u?.provider || u?.providerId || u?.provider_id || null;
  const uid = u?.uid || u?.userId || u?.id || u?._id || u?.uuid || null;
  return Boolean(
    u?.isAnonymous ||
      u?.anonymous ||
      u?.is_anonymous ||
      loginType === 'ANONYMOUS' ||
      loginType === 'anonymous' ||
      provider === 'anonymous' ||
      (typeof uid === 'string' && uid.startsWith('d-'))
  );
}

function getUidFromLoginState(loginState) {
  const u = loginState?.user;
  if (!u) return null;
  return u.uid || u.userId || u.id || u._id || u.uuid || null;
}

function getLoginNameCandidatesFromLoginState(loginState) {
  const u = loginState?.user;
  if (!u) {
    return {
      username: null,
      phone: null,
      email: null
    };
  }

  const username = u.username || u.userName || u.name || u.nickName || u.nickname || null;
  const phone = u.phoneNumber || u.phone_number || u.phone || u.mobile || u.mobileNumber || null;
  const email = u.email || u.mail || null;

  return {
    username,
    phone,
    email
  };
}

function isAlreadyOnAdminPage() {
  try {
    if (typeof window === 'undefined') return false;
    const href = window.location?.href || '';
    const u = new URL(href);
    const pathname = u.pathname || '';
    const hash = u.hash || '';
    return pathname.includes('/admin') || hash.includes('admin');
  } catch (e) {
    return false;
  }
}

export async function ensureAdminAccess($w) {
  const tcb = await $w?.cloud?.getCloudInstance?.();
  if (!tcb) {
    throw new Error('无法获取云开发实例');
  }

  const auth = getAuthSingleton(tcb);
  if (!auth) {
    throw new Error('当前环境未启用身份认证');
  }

  const forceLogin = shouldForceLogin();
  if (forceLogin) {
    try {
      if (auth?.signOut) {
        await auth.signOut();
      }
    } catch (e) {}
  }

  let loginState = null;
  try {
    if (auth?.getLoginState) {
      loginState = await auth.getLoginState();
    }
  } catch (e) {
    loginState = null;
  }

  if (forceLogin) {
    loginState = null;
  }

  if (loginState && isAnonymousLoginState(loginState)) {
    loginState = null;
  }

  const uid = getUidFromLoginState(loginState);
  if (loginState && !uid) {
    loginState = null;
  }

  if (loginState && auth?.getAccessToken) {
    try {
      const res = await auth.getAccessToken();
      if (!res?.accessToken) {
        loginState = null;
      }
    } catch (e) {
      loginState = null;
    }
  }

  if (!loginState) {
    if (!auth?.toDefaultLoginPage) {
      throw new Error('当前环境不支持托管登录页跳转，请确认 CloudBase SDK 版本');
    }

    try {
      if (typeof window !== 'undefined' && window?.sessionStorage?.setItem) {
        window.sessionStorage.setItem(__POST_LOGIN_TO_ADMIN_STORAGE_KEY, '1');
      }
    } catch (e) {}

    let redirectUri = '';
    if (typeof window !== 'undefined') {
      try {
        const u = new URL(window.location.href);
        const marker = '/preview/';
        const idx = u.pathname.indexOf(marker);
        if (idx >= 0) {
          u.pathname = u.pathname.slice(0, idx + marker.length) + 'admin';
          u.search = '';
          u.hash = '';
          redirectUri = u.toString();
        } else {
          const parts = (u.pathname || '').split('/').filter(Boolean);
          if (parts[0] && parts[0].startsWith('app-')) {
            u.pathname = `/${parts[0]}/`;
            u.search = '';
            u.hash = '';
            redirectUri = u.toString();
          } else {
            redirectUri = window.location.href;
          }
        }
      } catch (e) {
        redirectUri = window.location.href;
      }
    }

    const redirectParams = {
      config_version: 'env',
      redirect_uri: redirectUri
    };
    if (CLOUDBASE_AUTH_APP_ID) {
      redirectParams.app_id = CLOUDBASE_AUTH_APP_ID;
    }

    await auth.toDefaultLoginPage(redirectParams);

    return {
      status: 'redirected',
      tcb,
      auth,
      uid: null
    };
  }

  try {
    if (typeof window !== 'undefined' && window?.sessionStorage?.getItem?.(__POST_LOGIN_TO_ADMIN_STORAGE_KEY) === '1') {
      try {
        window.sessionStorage.removeItem(__POST_LOGIN_TO_ADMIN_STORAGE_KEY);
      } catch (e) {}
      if ($w?.utils?.navigateTo && !isAlreadyOnAdminPage()) {
        $w.utils.navigateTo({
          pageId: 'admin',
          params: {
            _t: String(Date.now())
          }
        });
        return {
          status: 'redirected',
          tcb,
          auth,
          uid: uid || null
        };
      }
    }
  } catch (e) {}

  return {
    status: 'ok',
    tcb,
    auth,
    uid: uid || null
  };
}

export default function AuthGuardPage() {
  return null;
}
