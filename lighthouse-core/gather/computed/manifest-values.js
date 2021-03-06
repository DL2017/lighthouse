/**
 * @license Copyright 2016 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

const ComputedArtifact = require('./computed-artifact');
const icons = require('../../lib/icons');

const PWA_DISPLAY_VALUES = ['minimal-ui', 'fullscreen', 'standalone'];

// Historically, Chrome recommended 12 chars as the maximum short_name length to prevent truncation.
// See #69 for more discussion & https://developer.chrome.com/apps/manifest/name#short_name
const SUGGESTED_SHORTNAME_LENGTH = 12;

class ManifestValues extends ComputedArtifact {
  get name() {
    return 'ManifestValues';
  }

  static get validityIds() {
    return ['hasManifest', 'hasParseableManifest'];
  }

  /** @typedef {(val: NonNullable<LH.Artifacts.Manifest['value']>) => boolean} Validator */

  /**
   * @return {Array<{id: string, failureText: string, validate: Validator}>}
   */
  static get manifestChecks() {
    return [
      {
        id: 'hasStartUrl',
        failureText: 'Manifest does not contain a `start_url`',
        validate: manifestValue => !!manifestValue.start_url.value,
      },
      {
        id: 'hasIconsAtLeast192px',
        failureText: 'Manifest does not have icons at least 192px',
        validate: manifestValue => icons.doExist(manifestValue) &&
            icons.sizeAtLeast(192, manifestValue).length > 0,
      },
      {
        id: 'hasIconsAtLeast512px',
        failureText: 'Manifest does not have icons at least 512px',
        validate: manifestValue => icons.doExist(manifestValue) &&
            icons.sizeAtLeast(512, manifestValue).length > 0,
      },
      {
        id: 'hasPWADisplayValue',
        failureText: 'Manifest\'s `display` value is not one of: ' + PWA_DISPLAY_VALUES.join(' | '),
        validate: manifestValue => PWA_DISPLAY_VALUES.includes(manifestValue.display.value),
      },
      {
        id: 'hasBackgroundColor',
        failureText: 'Manifest does not have `background_color`',
        validate: manifestValue => !!manifestValue.background_color.value,
      },
      {
        id: 'hasThemeColor',
        failureText: 'Manifest does not have `theme_color`',
        validate: manifestValue => !!manifestValue.theme_color.value,
      },
      {
        id: 'hasShortName',
        failureText: 'Manifest does not have `short_name`',
        validate: manifestValue => !!manifestValue.short_name.value,
      },
      {
        id: 'shortNameLength',
        failureText: 'Manifest `short_name` will be truncated when displayed on the homescreen',
        validate: manifestValue => !!manifestValue.short_name.value &&
            manifestValue.short_name.value.length <= SUGGESTED_SHORTNAME_LENGTH,
      },
      {
        id: 'hasName',
        failureText: 'Manifest does not have `name`',
        validate: manifestValue => !!manifestValue.name.value,
      },
    ];
  }

  /**
   * Returns results of all manifest checks
   * @param {LH.Artifacts['Manifest']} manifest
   * @return {Promise<LH.Artifacts.ManifestValues>}
   */
  async compute_(manifest) {
    // if the manifest isn't there or is invalid json, we report that and bail
    let parseFailureReason;

    if (manifest === null) {
      return {
        isParseFailure: true,
        parseFailureReason: 'No manifest was fetched',
        allChecks: [],
      };
    }
    const manifestValue = manifest.value;
    if (manifestValue === undefined) {
      return {
        isParseFailure: true,
        parseFailureReason: 'Manifest failed to parse as valid JSON',
        allChecks: [],
      };
    }

    // manifest is valid, so do the rest of the checks
    const remainingChecks = ManifestValues.manifestChecks.map(item => {
      return {
        id: item.id,
        failureText: item.failureText,
        passing: item.validate(manifestValue),
      };
    });

    return {
      isParseFailure: false,
      parseFailureReason,
      allChecks: remainingChecks,
    };
  }
}

module.exports = ManifestValues;
