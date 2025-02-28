import { AuraRingDataModel } from "./AuraRingDataModel.js";

export class AuraRingFlags
{
    static auraRingsKey = 'aura-rings';
    
    static versionKey = 'version';

    static hook = 'flags-updated';

    static namespace = 'token-aura-ring';

    // Flags
    static getAuraRings(tokenDocument)
    {
        const version = tokenDocument.getFlag(AuraRingFlags.namespace, AuraRingFlags.versionKey);

        if(!version || version < 3)
            AuraRingFlags.migrateData(tokenDocument);

        if (AuraRingFlags.hasAuraRings(tokenDocument)) {
            return tokenDocument.getFlag(AuraRingFlags.namespace, AuraRingFlags.auraRingsKey);
        }

        return {};
    }

    static hasAuraRings(tokenDocument)
    {
        if (tokenDocument.flags.hasOwnProperty(AuraRingFlags.namespace) === false) {
            return false;
        }

        return tokenDocument.flags[AuraRingFlags.namespace].hasOwnProperty(AuraRingFlags.auraRingsKey);
    }

    /**
     * Set the TokenDocument's Aura Ring Flag
     * @param {TokenDocument} tokenDocument 
     * @param {AuraRing} auraRings 
     * @param {boolean} directly Whether to set the flag directly, to avoid re-rendering
     */
    static async setAuraRings(tokenDocument, auraRings, directly = false)
    {
        if (directly) {
            tokenDocument.flags[AuraRingFlags.namespace][AuraRingFlags.auraRingsKey] = auraRings
        } else {
            //We unset the flags first so any deleted auras get really deleted
            await tokenDocument.unsetFlag(AuraRingFlags.namespace, AuraRingFlags.auraRingsKey);
            await tokenDocument.setFlag(AuraRingFlags.namespace, AuraRingFlags.auraRingsKey, auraRings);
        }
        
        Hooks.call(AuraRingFlags.hook);
    }

    // Auras
    static nextAvailableId(auraRings)
    {
        let potentialId = 1;
        const usedIds = [];

        for (const key in auraRings) {
            usedIds.push(auraRings[key].id);
        }

        while (potentialId < 100) {
            if (usedIds.includes(potentialId) === false) {
                return potentialId;
            }

            potentialId++;
        }
    }

    // Migration
    static async migrateData(tokenDocument)
    {
        console.log('[token-aura-ring]', 'migrateData called for token', tokenDocument.name, tokenDocument.id);
        //Migrations are done sequentially to avoid losing data: V1 => V2 and then V2 => V3
        if (AuraRingFlags.needsMigration(tokenDocument)) {
            console.log('[token-aura-ring]', 'needs migration from V1');
            //try to get the aura rings from V2
            const auraRingsV2 = AuraRingFlags.hasAuraRings(tokenDocument) ? tokenDocument.getFlag(AuraRingFlags.namespace, AuraRingFlags.auraRingsKey) : [];
    
            for (const key in tokenDocument.flags[AuraRingFlags.namespace]) {
                if (key === AuraRingFlags.auraRingsKey) {
                    continue;
                }
    
                const oldAuraRing = tokenDocument.getFlag(AuraRingFlags.namespace, key);
                const newAuraRing = AuraRingFlags.migrateFromV1(
                    oldAuraRing,
                    AuraRingFlags.nextAvailableId(auraRingsV2),
                    key,
                );
    
                auraRingsV2.push(newAuraRing);
                tokenDocument.unsetFlag(AuraRingFlags.namespace, key);
            }
            
            await AuraRingFlags.setAuraRings(tokenDocument, auraRingsV2);
        }

        if (AuraRingFlags.needsMigrationFromV2(tokenDocument)) {
            console.log('[token-aura-ring]', 'needs migration from V2');

            const auraRingsV2 = AuraRingFlags.hasAuraRings(tokenDocument) ? tokenDocument.getFlag(AuraRingFlags.namespace, AuraRingFlags.auraRingsKey) : [];
            const auraRingsV3 = {}

            let index = 1;
            for (const auraRing of auraRingsV2) {
                auraRingsV3[`aura${auraRing.id}`] = auraRing;
                index++;
            }

            await AuraRingFlags.setAuraRings(tokenDocument, auraRingsV3);
            await tokenDocument.setFlag(AuraRingFlags.namespace, AuraRingFlags.versionKey, 3);
        }
    }

    static migrateFromV1(oldAuraRing, newId, name)
    {
        const newAuraRing = AuraRingDataModel.defaultSettings();

        newAuraRing.id = newId;
        newAuraRing.name = name;

        AuraRingFlags.migrateField(oldAuraRing, 'angle', newAuraRing, 'angle');
        AuraRingFlags.migrateField(oldAuraRing, 'direction', newAuraRing, 'direction');
        AuraRingFlags.migrateField(oldAuraRing, 'radius', newAuraRing, 'radius');
        AuraRingFlags.migrateField(oldAuraRing, 'colour', newAuraRing, 'stroke_colour');
        AuraRingFlags.migrateField(oldAuraRing, 'opacity', newAuraRing, 'stroke_opacity');
        AuraRingFlags.migrateField(oldAuraRing, 'weight', newAuraRing, 'stroke_weight');
        AuraRingFlags.migrateField(oldAuraRing, 'visibility', newAuraRing, 'visibility');

        return newAuraRing;
    }

    static needsMigration(tokenDocument)
    {
        if (tokenDocument.flags.hasOwnProperty(AuraRingFlags.namespace) === false) {
            return false;
        }

        for (const key in tokenDocument.flags[AuraRingFlags.namespace]) {
            if (key !== AuraRingFlags.auraRingsKey) {
                return true;
            }
        }

        return false;
    }

    static needsMigrationFromV2(tokenDocument)
    {
        if (Array.isArray(tokenDocument.flags[AuraRingFlags.namespace][AuraRingFlags.auraRingsKey]))
            return true;
        
        return false;
    }

    static migrateField(source, sourceKey, target, targetKey)
    {
        if (source.hasOwnProperty(sourceKey) === true) {
            target[targetKey] = source[sourceKey];
        }
    }
}
