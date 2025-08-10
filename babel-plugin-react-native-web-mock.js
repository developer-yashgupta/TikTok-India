module.exports = function() {
  return {
    visitor: {
      ImportDeclaration(path, state) {
        if (path.node.source.value === 'react-native-web/dist/index') {
          // Add missing exports
          const missingExports = {
            PermissionsAndroid: {
              PERMISSIONS: {
                CAMERA: 'android.permission.CAMERA',
                RECORD_AUDIO: 'android.permission.RECORD_AUDIO',
                READ_EXTERNAL_STORAGE: 'android.permission.READ_EXTERNAL_STORAGE',
                WRITE_EXTERNAL_STORAGE: 'android.permission.WRITE_EXTERNAL_STORAGE'
              },
              RESULTS: {
                GRANTED: 'granted',
                DENIED: 'denied',
                NEVER_ASK_AGAIN: 'never_ask_again'
              },
              request: async () => 'granted'
            },
            ViewPropTypes: {},
            requireNativeComponent: () => null,
            TurboModuleRegistry: {
              getEnforcing: () => ({})
            }
          };

          // Add missing exports to the import declaration
          Object.keys(missingExports).forEach(exportName => {
            if (path.node.specifiers.some(spec => 
              spec.type === 'ImportSpecifier' && spec.imported.name === exportName
            )) {
              // Export already exists, skip
              return;
            }

            path.node.specifiers.push(
              state.types.importSpecifier(
                state.types.identifier(exportName),
                state.types.identifier(exportName)
              )
            );
          });
        }
      }
    }
  };
};
