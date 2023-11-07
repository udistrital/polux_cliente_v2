export const environment = {
  production: true,
  entorno: 'prod',
  autenticacion: true,
  notificaciones: false,
  menuApps: false,
  appname: 'polux',
  appMenu: 'Polux',
  ACADEMICA_SERVICE: "https://autenticacion.portaloas.udistrital.edu.co/apioas/academica_jbpm/v1",
  CONFIGURACION_SERVICE: 'https://autenticacion.portaloas.udistrital.edu.co/apioas/configuracion_crud_api/v1/',
  CORE_AMAZON_CRUD_SERVICE: "https://autenticacion.portaloas.udistrital.edu.co/apioas/core_amazon_crud/v1/",
  CORE_SERVICE: "https://autenticacion.portaloas.udistrital.edu.co/apioas/core_api/v1/",
  POLUX_MID_SERVICE: "https://autenticacion.portaloas.udistrital.edu.co/apioas/polux_mid/v1/",
  POLUX_SERVICE: "https://autenticacion.portaloas.udistrital.edu.co/apioas/polux_crud/v1/",
  GESTOR_DOCUMENTAL_SERVICE: 'https://autenticacion.portaloas.udistrital.edu.co/apioas/gestor_documental_mid/v1/',
  NOTIFICACION_SERVICE: 'https://autenticacion.portaloas.udistrital.edu.co/apioas/notificacion_mid/v1/',
  OIKOS_SERVICE: "https://autenticacion.portaloas.udistrital.edu.co/apioas/oikos_crud_api/v2/",
  PARAMETROS_SERVICE: 'https://autenticacion.portaloas.udistrital.edu.co/apioas/parametros/v1/',
  SESIONES_SERVICE: "https://autenticacion.portaloas.udistrital.edu.co/apioas/sesiones_crud/v2/",
  TOKEN: {
    AUTORIZATION_URL: 'https://autenticacion.portaloas.udistrital.edu.co/oauth2/authorize',
    CLIENTE_ID: 'solicitar token a arquitectura',
    RESPONSE_TYPE: 'id_token token',
    SCOPE: 'openid email role documento',
    REDIRECT_URL: 'https://oas.portaloas.udistrital.edu.co',
    SIGN_OUT_URL: 'https://autenticacion.portaloas.udistrital.edu.co/oidc/logout',
    SIGN_OUT_REDIRECT_URL: 'https://oas.portaloas.udistrital.edu.co',
    AUTENTICACION_MID: 'https://autenticacion.portaloas.udistrital.edu.co/apioas/autenticacion_mid/v1/token/userRol',
  },
};
