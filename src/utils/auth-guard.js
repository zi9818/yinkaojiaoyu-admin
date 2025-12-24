export const CLOUDBASE_AUTH_APP_ID = '';
export const ADMIN_ALLOWLIST_COLLECTION = 'admin_allowlist';

const __AUTH_GLOBAL_KEY = '__yinkaojiaoyu_admin_cloudbase_auth__';

function getAuthSingleton(tcb) {
  if (!tcb) return null;
  const g = typeof globalThis !== 'undefined' ? globalThis : null;
  if (g && g[__AUTH_GLOBAL_KEY]) {
    return g[__AUTH_GLOBAL_KEY];
  }
  const auth = tcb?.auth?.();
  if (g && auth) {
    g[__AUTH_GLOBAL_KEY] = auth;
  }
  return auth;
}

function shouldForceLogin() {
  try {
    if (typeof window === 'undefined') return false;
    const sp = new URLSearchParams(window.location.search || '');
    return sp.get('forceLogin') === '1';
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

export async function ensureAdminAccess($w) {
  const tcb = await $w?.cloud?.getCloudInstance?.();
  if (!tcb) {
    throw new Error('无法获取云开发实例');
  }

  const auth = getAuthSingleton(tcb);
  if (!auth) {
    throw new Error('当前环境未启用身份认证');
  }

  if (shouldForceLogin()) {
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

    const redirectParams = {
      config_version: 'env',
      redirect_uri: typeof window !== 'undefined' ? window.location.href : ''
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

  return {
    status: 'ok',
    tcb,
    auth,
    uid: uid || null
  };
}
