import { AuraRingCanvas } from "./AuraRingCanvas.js";
import { AuraRingDataModel } from "./AuraRingDataModel.js"
import { AuraRingDirectory } from "./AuraRingDirectory.js";
import { AuraRingFlags } from "./AuraRingFlags.js";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api

export class AuraRingSettings extends HandlebarsApplicationMixin(ApplicationV2)
{
    static DEFAULT_OPTIONS = {
        actions: {
            addAuraRing: AuraRingSettings.handleAddAuraRing,
            changeTab: AuraRingSettings.handleChangeTab,
            copyAuraRing: AuraRingSettings.handleCopy,
            deleteAuraRing: AuraRingSettings.handleDeleteAuraRing,
            duplicateAuraRing: AuraRingSettings.handleDuplicateAuraRing,
            openDirectory: AuraRingSettings.handleOpenDirectory,
            pasteAuraRing: AuraRingSettings.handlePaste,
            saveToDirectory: AuraRingSettings.handleSaveToDirectory,
            toggleHide: AuraRingSettings.handleToggleHide,
        },
        form: {
            handler: AuraRingSettings.handleForm,
            submitOnChange: false,
            closeOnSubmit: true,
        },
        id: `${AuraRingFlags.namespace}-{id}`,
        position: {
            height: 640,
            width: 640,
        },
        tag: "form",
        window: {
            contentClasses: [
                'package-configuration',
            ],
            icon: 'fas fa-ring',
            minimizable: true,
            resizable: true,
            title: 'Aura Ring Configuration',
        },
    };

    static PARTS = {
        main: {
            template: 'modules/token-aura-ring/settings.html',
        },
    };

    auraRings = {};

    currentTab = 0;

    preview;

    // Getters
    /** @returns {AuraRing|null} */
    get clipboard()
    {
        return JSON.parse(
            sessionStorage.getItem(AuraRingCanvas.key),
        );
    }

    get title()
    {
        return `Aura Ring Configuration: ${this.preview.name}`;
    }

    get tokenId()
    {
        return this.preview.id;
    }

    // Setters
    /** @param {AuraRing} auraRing */
    set clipboard(auraRing)
    {
        sessionStorage.setItem(
            AuraRingCanvas.key, 
            JSON.stringify(auraRing),
        );
    }

    // Setup
    constructor(simpleTokenDocument, options = {}) {
        super(options);
        this.registerHooks();
        this.preview = simpleTokenDocument;
        this.auraRings = AuraRingFlags.getAuraRings(this.preview);
    }

    async close(options = {})
    {
        this.deregisterHooks();
        return super.close(options);
    }

    registerHooks()
    {
        Hooks.on(AuraRingFlags.hook, this.renderDirectory);
    }

    renderDirectory = () => {
        this.render();
    }

    deregisterHooks()
    {
        Hooks.off(AuraRingFlags.hook, this.renderDirectory);
    }

    _onChangeForm(context, event)
    {
        if (event.target.form !== null) {
            this.previewFormData(event.target.form);
        }
    }

    _onRender(context, options)
    {
        super._onRender(context, options);

        this.addEventListeners();
        this.changeTab(this.currentTab);
        this.previewFormData(this.element);
    }

    _prepareContext(options)
    {
        const auraRings = this.auraRings;
        const auraKeys = Object.keys(auraRings).sort();
        if (this.currentTab === null && auraKeys.length > 0) {
            this.currentTab = auraRings[auraKeys[0]].id;
        }

        const dataModels = {};

        for (const auraKey of auraKeys) {
            try {
                dataModels[auraKey] = new AuraRingDataModel(auraRings[auraKey]);
            } catch (error) {
                console.error('A malformed Aura Ring was detected; removing.');
                this.deleteAuraRing(auraRings[auraKey].id);
            }
        }

        return {
            auraRings: dataModels,
            clipboardEmpty: this.clipboard === null,
        };
    }

    static register(config)
    {
        const formApplication = new AuraRingSettings(config.preview);
    
        const icon = document.createElement('i');
        icon.classList.add('fas', 'fa-ring');

        const text = document.createTextNode(' Configure Token Aura Rings');

        const button = document.createElement('button');
        button.append(icon, text);
        button.style.whiteSpace = 'nowrap';
        button.type = 'button';
        button.addEventListener('click', formApplication.render.bind(formApplication, true));

        const formGroup = document.createElement('div');
        formGroup.classList.add('form-group');
        formGroup.append(button);

        config.form.children[1].appendChild(formGroup);
        config.form.parentElement.parentElement.style.height = 'auto';
    }

    static sortAuraRings(first, second) {
        const firstName = first.name.toLowerCase();
        const secondName = second.name.toLowerCase();

        if (firstName < secondName) {
            return -1;
        }

        if (firstName > secondName) {
            return 1;
        }

        return 0;
    }

    // Handlers
    static async handleAddAuraRing()
    {
        this.addAuraRing();
    }

    static async handleChangeTab(event)
    {
        const auraId = parseInt(event.target.dataset.aura);
        this.changeTab(auraId);
    }

    static async handleCopy(event)
    {
        const auraId = parseInt(event.target.dataset.aura);
        this.copyAuraRing(auraId);
    }

    static async handleDeleteAuraRing(event)
    {
        const auraId = parseInt(event.target.dataset.aura);
        this.confirmDelete(auraId);
    }

    static async handleDuplicateAuraRing(event)
    {
        const auraId = parseInt(event.target.dataset.aura);
        this.duplicateAuraRing(auraId);
    }

    static async handleForm(event, form, formData)
    {
        const newAuraRings = this.gatherFormData(formData);
        await AuraRingFlags.setAuraRings(this.preview, newAuraRings);
    }

    static async handleOpenDirectory()
    {
        AuraRingDirectory.open(this);
    }

    static async handlePaste()
    {
        this.pasteAuraRing();
    }

    static async handleRenameAuraRing(event)
    {
        const auraId = parseInt(event.target.dataset.aura);
        this.renameAuraRing(auraId, event.target.value);
    }

    static async handleSaveToDirectory(event)
    {
        const auraId = parseInt(event.target.dataset.aura);
        const auraRing = this.getAuraRing(auraId);
        AuraRingDirectory.put(auraRing);
    }

    static async handleToggleHide(event)
    {
        const auraId = parseInt(event.target.dataset.aura);
        this.toggleHideAuraRing(auraId);
    }

    // Aura Rings
    addAuraRing(auraRing = null)
    {
        const id = AuraRingFlags.nextAvailableId(this.auraRings);
        const auraKey = `aura${id}`;
        let newAuraRing;

        if (auraRing)
            newAuraRing = {...auraRing, id};
        else {
            newAuraRing = {
                id,
                name: 'New Aura Ring',
            };
        }        

        this.auraRings[auraKey] = newAuraRing;

        this.currentTab = id;
        this.render();
    }

    /**
     * Create a clone of an Aura Ring without an ID
     * @param {number} id 
     * @returns {AuraRing}
     */
    cloneAuraRing(id)
    {
        const source = this.getAuraRing(id);
        const clone = foundry.utils.deepClone(source);
        clone.id = null;
        clone.name = `Copy of ${source.name}`;
        return clone;
    }

    /**
     * Copy an Aura Ring to the clipboard
     * @param {number} id 
     */
    copyAuraRing(id)
    {
        this.clipboard = this.cloneAuraRing(id);
        this.render();
    }

    deleteAuraRing(id)
    {
        delete this.auraRings[`aura${id}`];
        this.currentTab = null;
        this.render();
    }

    /**
     * Create a duplicate Aura Ring on this Token
     * @param {number} id 
     */
    duplicateAuraRing(id)
    {
        const clone = this.cloneAuraRing(id);
        clone.id = AuraRingFlags.nextAvailableId(this.auraRings);
        this.auraRings[`aura${clone.id}`] = clone;
        this.currentTab = clone.id;
        this.render();
    }

    getAuraRing(id)
    {
        return this.auraRings[`aura${id}`];
    }

    /**
     * Paste an Aura Ring from the clipboard
     */
    pasteAuraRing()
    {
        const clone = this.clipboard;

        if (clone !== null) {
            clone.id = AuraRingFlags.nextAvailableId(this.auraRings);
            this.auraRings[`aura${clone.id}`] = clone;
            this.currentTab = clone.id;
            this.render();
        }
    }

    renameAuraRing(id, name)
    {
        this.auraRings[`aura${id}`].name = name;
        this.render();
    }

    toggleHideAuraRing(id)
    {
        this.auraRings[`aura${id}`].hide = !this.auraRings[`aura${id}`].hide;
        this.render();
    }

    // Dialogs
    confirmDelete(id)
    {
        const auraRing = this.getAuraRing(id);

        new foundry.applications.api.DialogV2({
            buttons: [
                {
                    action: 'cancel',
                    icon: 'fas fa-ban',
                    label: 'Cancel',
                },
                {
                    action: 'confirm',
                    callback: this.deleteAuraRing.bind(this, id),
                    icon: 'fas fa-trash',
                    label: 'Delete',
                },
            ],
            content: `
                <p>Are you sure you want to delete the Aura Ring "${auraRing.name}"?</p>
                <p><strong>This cannot be undone.</strong></p>
            `,
            window: {
                title: `Delete ${auraRing.name}`,
            },
        }).render(true);
    }

    // Window
    addEventListeners()
    {
        const inputs = document.querySelectorAll('[data-action="renameAuraRing"]');

        for (const input of inputs) {
            input.addEventListener(
                'change', 
                AuraRingSettings.handleRenameAuraRing.bind(this),
            );
        }
    }

    changeTab(target)
    {
        const articles = document.querySelectorAll('[data-group="auraRingArticles"]');
        const tabs = document.querySelectorAll('[data-group="auraRingTabs"]');
        
        const targetId = `${target}`;

        for (const article of articles) {
            if (article.dataset.aura === targetId) {
                article.classList.add('active');
                article.classList.remove('hidden');
            } else {
                article.classList.remove('active');
                article.classList.add('hidden');
            }
        }

        for (const tab of tabs) {
            tab.dataset.aura === targetId
                ? tab.classList.add('active')
                : tab.classList.remove('active');
        }

        this.currentTab = target;
    }

    gatherFormData(formData)
    {
        const data = {};
        const newAuraRings = {};

        for (const field in formData.object) {
            const index = field.indexOf('_');
            const id = parseInt(
                field.slice(0, index),
            );
            const key = field.slice(index + 1);
            const value = formData.object[field];

            if (data.hasOwnProperty(id) === false) {
                data[id] = {
                    id: id,
                };
            }

            data[id][key] = value;
        }

        for (const key in data) {
            newAuraRings[`aura${data[key].id}`] = data[key];
        }

        return newAuraRings;
    }

    previewFormData(form)
    {
        const formData = new FormDataExtended(form);
        const newAuraRings = this.gatherFormData(formData);

        for (const key in newAuraRings) {
            this.auraRings[key] = newAuraRings[key];
        }

        AuraRingCanvas.handleRefreshToken(this.preview.object);
    }
}
