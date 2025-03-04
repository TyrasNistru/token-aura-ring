import { AuraRingDataModel } from "./AuraRingDataModel.js";
import { AuraRingDirectory } from "./AuraRingDirectory.js";
import { AuraRingFlags } from "./AuraRingFlags.js";

export class AuraRingApi
{
    /**
     * TODO Make an actual class
     * A Token Aura Ring
     * @typedef  {Object}   AuraRing
     * @property {number}   angle               How wide the Aura Ring should be, from 5 to 360 degrees
     * @property {number}   direction           Which way the Aura Ring should face, from -180 to 180 degrees
     * @property {string}   fill_colour         The fill colour in hex
     * @property {number}   fill_opacity        The fill opacity as a fraction between 0 and 1
     * @property {boolean}  hide                Whether the Aura Ring should be shown
     * @property {number}   id                  The unique numeric identifier of the Aura Ring
     * @property {string}   name                The display name of the Aura Ring
     * @property {number}   radius              The radius of the Aura Ring, from 0
     * @property {boolean}  respect_fog         Whether to hide the Aura Ring when the eminating token cannot be seen
     * @property {boolean}  stroke_close        Whether to stroke the complete outline of the Aura Ring
     * @property {string}   stroke_colour       The stroke colour in hex
     * @property {number}   stroke_opacity      The stroke opacity as a fraction between 0 and 1
     * @property {number}   stroke_weight       The stroke weight in pixels, from 0
     * @property {boolean}  use_grid_shapes     Whether to use grid shapes, if enabled
     * @property {string}   visibility          Which user roles can see the Aura Ring
     */

    /**
     * Retrieve all Aura Rings
     * 
     * @param {TokenDocument} tokenDocument
     * 
     * @returns {Object}
     */
    static all(tokenDocument)
    {
        return AuraRingFlags.getAuraRings(tokenDocument);
    }

    /**
     * Get an unsaved empty Aura Ring without an ID
     * 
     * @returns {AuraRing}
     */
    static blank()
    {
        return AuraRingDataModel.defaultSettings();
    }

    /**
     * Remove an Aura Ring
     * 
     * @param {TokenDocument*} tokenDocument
     * @param {number} id
     */
    static delete(tokenDocument, id)
    {
        const auraRings = AuraRingFlags.getAuraRings(tokenDocument);        

        if (auraRings.hasOwn(`aura${id}`) !== false) {
            delete auraRings[`aura${id}`]
            AuraRingFlags.setAuraRings(tokenDocument, auraRings);
        }
    }

    /**
     * Remove all Aura Rings
     * 
     * @param {TokenDocument} tokenDocument
     */
    static deleteAll(tokenDocument)
    {
        AuraRingFlags.setAuraRings(tokenDocument, {});
    }

    /**
     * Open the Aura Ring Directory
     * 
     * @param {TokenDocument|null} tokenDocument
     */
    static directory(tokenDocument = null)
    {
        AuraRingDirectory.open(tokenDocument);
    }

    /**
     * Retrieve a specific Aura Ring
     * 
     * @param {TokenDocument} tokenDocument
     * @param {number|string} term
     * @param {string} field
     * 
     * @returns {AuraRing|false}
     */
    static get(tokenDocument, term, field = 'id')
    {
        const auraRings = AuraRingFlags.getAuraRings(tokenDocument);

        return AuraRingApi.getAuraRing(auraRings, term, field);
    }

    /**
     * Retrieve an Aura Ring by any field
     * 
     * @param {AuraRing[]} auraRings 
     * @param {number|string} term
     * @param {string} field
     * @returns {AuraRing|false}
     */
    static getAuraRing(auraRings, term, field = 'id')
    {
        for (const auraKey in auraRings) {
            if (auraRings[auraKey][field] == term) {
                return auraRings[auraKey];
            }
        }

        return false;
    }

    /**
     * Retrieve a list of Aura Ring names keyed by their ID
     * 
     * @param {TokenDocument} tokenDocument
     * 
     * @returns {Object}
     */
    static index(tokenDocument)
    {
        const auraRings = AuraRingFlags.getAuraRings(tokenDocument);
        const index = {};

        for (const auraRing of auraRings) {
            index[auraRing.id] = auraRing.name;
        }

        return index;
    }

    /**
     * Create a new Aura Ring from the default settings
     * The ID of the Aura Ring will be set to the next available
     * 
     * @param {TokenDocument} tokenDocument
     * 
     * @returns {AuraRing} As given, but with the new ID
     */
    static new(tokenDocument)
    {
        const auraRings = AuraRingFlags.getAuraRings(tokenDocument);
        const auraRing = AuraRingDataModel.defaultSettings();

        auraRing.id = AuraRingFlags.nextAvailableId(auraRings);
        auraRings[`aura${auraRing.id}`] = auraRing;
        AuraRingFlags.setAuraRings(tokenDocument, auraRings);

        return auraRing;
    }

    /**
     * Add or overwrite an Aura Ring
     * 
     * @param {TokenDocument} tokenDocument 
     * @param {AuraRing} auraRing
     */
    static set(tokenDocument, auraRing)
    {
        const isPreview = tokenDocument.object.hasPreview === true;

        if (isPreview === true) {
            tokenDocument = tokenDocument.object._preview.document;
        }

        const auraRings = AuraRingFlags.getAuraRings(tokenDocument);

        if (auraRing.id === null) {
            auraRing.id = AuraRingFlags.nextAvailableId(auraRings);
        }

        auraRings[`aura${auraRing.id}`] = auraRing;
        AuraRingFlags.setAuraRings(tokenDocument, auraRings, isPreview);
    }

    /**
     * Overwrite all Aura Rings with a new set
     * 
     * @param {TokenDocument} tokenDocument 
     * @param {Array[AuraRing]} auraRings 
     */
    static setAll(tokenDocument, auraRings)
    {
        AuraRingFlags.setAuraRings(tokenDocument, auraRings);
    }

    /**
     * Update a specific Aura Ring value directly
     * 
     * @param {TokenDocument} tokenDocument 
     * @param {number} id 
     * @param {string} key 
     * @param {number|string|boolean} value 
     */
    static setValue(tokenDocument, id, key, value)
    {
        const auraRings = AuraRingFlags.getAuraRings(tokenDocument);        
        auraRings[`aura${id}`][key] = value;
        AuraRingFlags.setAuraRings(tokenDocument, auraRings);
    }
}
