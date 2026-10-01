export interface paths {
    "/v1/health": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * health
         * @description Implemented development behavior; all full-GA release obligations remain open.
         */
        get: operations["health"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/workspaces": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * list workspaces
         * @description Implemented development behavior; all full-GA release obligations remain open.
         */
        get: operations["listWorkspaces"];
        put?: never;
        /**
         * create workspace
         * @description Implemented development behavior; all full-GA release obligations remain open.
         */
        post: operations["createWorkspace"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/session": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /**
         * sign out local session
         * @description Removes development cookie only. Production identity signout uses the configured identity provider.
         */
        delete: operations["signOutLocalSession"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/local-session": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * local session
         * @description Loopback development bootstrap only; disabled in production. Supply private secret through local UI. Not a production authentication mechanism.
         */
        post: operations["localSession"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/integrations": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * list integrations
         * @description Implemented development behavior; all full-GA release obligations remain open.
         */
        get: operations["listIntegrations"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/brands": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * list brands
         * @description Implemented development behavior; all full-GA release obligations remain open.
         */
        get: operations["listBrands"];
        put?: never;
        /**
         * confirm brand
         * @description Implemented development behavior; all full-GA release obligations remain open.
         */
        post: operations["confirmBrand"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/emails": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * list emails
         * @description Implemented development behavior; all full-GA release obligations remain open.
         */
        get: operations["listEmails"];
        put?: never;
        /**
         * create email
         * @description Implemented development behavior; all full-GA release obligations remain open.
         */
        post: operations["createEmail"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/contacts": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * list contacts
         * @description Implemented development behavior; all full-GA release obligations remain open.
         */
        get: operations["listContacts"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/campaigns": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * list campaigns
         * @description Implemented development behavior; all full-GA release obligations remain open.
         */
        get: operations["listCampaigns"];
        put?: never;
        /**
         * create campaign
         * @description Implemented development behavior; all full-GA release obligations remain open.
         */
        post: operations["createCampaign"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/segments": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * list segments
         * @description Implemented development behavior; all full-GA release obligations remain open.
         */
        get: operations["listSegments"];
        put?: never;
        /**
         * create segment
         * @description Implemented development behavior; all full-GA release obligations remain open.
         */
        post: operations["createSegment"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/api-keys": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * list api keys
         * @description Implemented development behavior; all full-GA release obligations remain open.
         */
        get: operations["listApiKeys"];
        put?: never;
        /**
         * create api key
         * @description Implemented development behavior; all full-GA release obligations remain open.
         */
        post: operations["createApiKey"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/audit": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * list audit
         * @description Implemented development behavior; all full-GA release obligations remain open.
         */
        get: operations["listAudit"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/email-revisions": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * list revisions
         * @description Implemented development behavior; all full-GA release obligations remain open.
         */
        get: operations["listRevisions"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/brands/current": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * get current brand
         * @description Implemented development behavior; all full-GA release obligations remain open.
         */
        get: operations["getCurrentBrand"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/brands/from-url": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * extract brand
         * @description Implemented development behavior; all full-GA release obligations remain open.
         */
        post: operations["extractBrand"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/emails/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * get email
         * @description Implemented development behavior; all full-GA release obligations remain open.
         */
        get: operations["getEmail"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/emails/generate": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * generate email
         * @description Queues a durable proposal only. Unconfigured AI/finite allowance produces an honest inspectable error; never sends.
         */
        post: operations["generateEmail"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/emails/{id}/draft": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /**
         * save draft
         * @description Implemented development behavior; all full-GA release obligations remain open.
         */
        patch: operations["saveDraft"];
        trace?: never;
    };
    "/v1/emails/{id}/revisions": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * checkpoint email
         * @description Implemented development behavior; all full-GA release obligations remain open.
         */
        post: operations["checkpointEmail"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/emails/{id}/restore": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * restore email
         * @description Implemented development behavior; all full-GA release obligations remain open.
         */
        post: operations["restoreEmail"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/emails/{id}/preview": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * preview email
         * @description Implemented development behavior; all full-GA release obligations remain open.
         */
        post: operations["previewEmail"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/emails/{id}/import-html": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * import html
         * @description Implemented development behavior; all full-GA release obligations remain open.
         */
        post: operations["importHtml"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/email-revisions/{id}/download": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * download revision
         * @description Implemented development behavior; all full-GA release obligations remain open.
         */
        get: operations["downloadRevision"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/email-revisions/{id}/preflight": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * preflight revision
         * @description Implemented development behavior; all full-GA release obligations remain open.
         */
        post: operations["preflightRevision"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/email-revisions/{id}/export": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * export revision
         * @description Provider or release gates are unconfigured. No remote success, approval or sending is implied.
         */
        post: operations["exportRevision"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/operations/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * get operation
         * @description Scope is determined by operation type (brands, emails or audience); no generic recipient-data access.
         */
        get: operations["getOperation"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/operations/{id}/cancel": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * cancel operation
         * @description Durable cancellation; running external reservations remain held until definitive resolution. Not a keyed replay contract.
         */
        post: operations["cancelOperation"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/audience-schema": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * get audience schema
         * @description Bounded development catalog:200lists/tags and100segments. Dedicated full-GA catalog controls remain required.
         */
        get: operations["getAudienceSchema"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/lists": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * create list
         * @description Implemented development behavior; all full-GA release obligations remain open.
         */
        post: operations["createList"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/tags": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * create tag
         * @description Implemented development behavior; all full-GA release obligations remain open.
         */
        post: operations["createTag"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/contact-fields": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * create contact field
         * @description Implemented development behavior; all full-GA release obligations remain open.
         */
        post: operations["createContactField"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/contacts/{id}/profile": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /**
         * update contact profile
         * @description Implemented development behavior; all full-GA release obligations remain open.
         */
        patch: operations["updateContactProfile"];
        trace?: never;
    };
    "/v1/contacts/{id}/suppress": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * suppress contact
         * @description Implemented development behavior; all full-GA release obligations remain open.
         */
        post: operations["suppressContact"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/segments/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * get segment
         * @description Implemented development behavior; all full-GA release obligations remain open.
         */
        get: operations["getSegment"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/segments/{id}/versions": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * create segment version
         * @description Implemented development behavior; all full-GA release obligations remain open.
         */
        post: operations["createSegmentVersion"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/segments/{id}/preview": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * preview segment
         * @description Implemented development behavior; all full-GA release obligations remain open.
         */
        post: operations["previewSegment"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/segments/{id}/snapshots": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * freeze audience
         * @description Implemented development behavior; all full-GA release obligations remain open.
         */
        post: operations["freezeAudience"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/audience-snapshots/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * get audience snapshot
         * @description Implemented development behavior; all full-GA release obligations remain open.
         */
        get: operations["getAudienceSnapshot"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/contact-imports/inspect": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * inspect import
         * @description Implemented development behavior; all full-GA release obligations remain open.
         */
        post: operations["inspectImport"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/contact-imports": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * dry run import
         * @description Implemented development behavior; all full-GA release obligations remain open.
         */
        post: operations["dryRunImport"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/contact-imports/{id}/confirm": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * confirm import
         * @description Implemented development behavior; all full-GA release obligations remain open.
         */
        post: operations["confirmImport"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/contact-imports/{id}/errors": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * import errors
         * @description Bounded error rows from one immutable import result; legacy integer cursor is not a resource-page cursor.
         */
        get: operations["importErrors"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/campaigns/{id}/submit-review": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * submit campaign review
         * @description Implemented development behavior; all full-GA release obligations remain open.
         */
        post: operations["submitCampaignReview"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/campaigns/{id}/approve": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * approve campaign
         * @description Provider or release gates are unconfigured. No remote success, approval or sending is implied.
         */
        post: operations["approveCampaign"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/campaigns/{id}/send": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * send campaign
         * @description Provider or release gates are unconfigured. No remote success, approval or sending is implied.
         */
        post: operations["sendCampaign"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/campaigns/{id}/schedule": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * schedule campaign
         * @description Provider or release gates are unconfigured. No remote success, approval or sending is implied.
         */
        post: operations["scheduleCampaign"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/campaigns/{id}/pause": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * pause campaign
         * @description Implemented development behavior; all full-GA release obligations remain open.
         */
        post: operations["pauseCampaign"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/campaigns/{id}/resume": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * resume campaign
         * @description Provider or release gates are unconfigured. No remote success, approval or sending is implied.
         */
        post: operations["resumeCampaign"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/campaigns/{id}/cancel": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * cancel campaign
         * @description Implemented development behavior; all full-GA release obligations remain open.
         */
        post: operations["cancelCampaign"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/api-keys/{id}/rotate": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * rotate api key
         * @description Implemented development behavior; all full-GA release obligations remain open.
         */
        post: operations["rotateApiKey"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/api-keys/{id}/revoke": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * revoke api key
         * @description Implemented development behavior; all full-GA release obligations remain open.
         */
        post: operations["revokeApiKey"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/usage": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * get usage
         * @description Implemented development behavior; all full-GA release obligations remain open.
         */
        get: operations["getUsage"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
}
export type webhooks = Record<string, never>;
export interface components {
    schemas: {
        Brand: {
            name: string;
            website: string;
            description: string;
            voice: string;
            accent: string;
            background: string;
            /** @enum {string} */
            font_stack: "Arial, sans-serif" | "Georgia, serif" | "Verdana, sans-serif";
            address: string;
            forbidden_phrases: string[];
            approved_claims: string[];
            provenance: {
                source: string;
                captured_at: string;
                /** @enum {string} */
                status: "suggested" | "confirmed" | "edited";
            }[];
        };
        EmailSpec: {
            /** @constant */
            schema_version: "1.0";
            /** @enum {string} */
            editing_mode: "structured" | "raw_html";
            /** @enum {string} */
            locale: "en-US" | "en-GB" | "fr-FR" | "de-DE" | "es-ES" | "it-IT" | "pt-BR" | "nl-NL" | "sv-SE" | "da-DK" | "no-NO" | "fi-FI" | "pl-PL" | "cs-CZ" | "tr-TR" | "ja-JP" | "ko-KR" | "zh-CN" | "zh-TW" | "hi-IN" | "ar-SA" | "he-IL";
            /** @enum {string} */
            direction: "ltr" | "rtl";
            subject: string;
            preheader: string;
            brand_kit_version_id: string;
            theme: {
                content_width_px: number;
                background: string;
                accent: string;
                /** @enum {string} */
                font_stack: "Arial, sans-serif" | "Georgia, serif" | "Verdana, sans-serif";
            };
            sections: (({
                id: string;
                /** @constant */
                type: "hero";
                heading: string;
                text: string;
            } | {
                id: string;
                /** @constant */
                type: "text";
                text: string;
            } | {
                id: string;
                /** @constant */
                type: "image";
                src: string;
                alt: string;
                decorative?: boolean;
            } | {
                id: string;
                /** @constant */
                type: "button";
                label: string;
                href: string;
            } | {
                id: string;
                /** @constant */
                type: "divider";
            } | {
                id: string;
                /** @constant */
                type: "social";
                links: {
                    label: string;
                    href: string;
                }[];
            } | {
                id: string;
                /** @constant */
                type: "legal_footer";
                identity: string;
                address: string;
                /** @constant */
                unsubscribe_slot: true;
            } | {
                id: string;
                /** @constant */
                type: "product_card";
                title: string;
                description: string;
                price: string;
                href: string;
            } | {
                id: string;
                /** @constant */
                type: "custom_html";
                html: string;
            }) | {
                id: string;
                /** @constant */
                type: "columns";
                columns: ({
                    id: string;
                    /** @constant */
                    type: "hero";
                    heading: string;
                    text: string;
                } | {
                    id: string;
                    /** @constant */
                    type: "text";
                    text: string;
                } | {
                    id: string;
                    /** @constant */
                    type: "image";
                    src: string;
                    alt: string;
                    decorative?: boolean;
                } | {
                    id: string;
                    /** @constant */
                    type: "button";
                    label: string;
                    href: string;
                } | {
                    id: string;
                    /** @constant */
                    type: "divider";
                } | {
                    id: string;
                    /** @constant */
                    type: "social";
                    links: {
                        label: string;
                        href: string;
                    }[];
                } | {
                    id: string;
                    /** @constant */
                    type: "legal_footer";
                    identity: string;
                    address: string;
                    /** @constant */
                    unsubscribe_slot: true;
                } | {
                    id: string;
                    /** @constant */
                    type: "product_card";
                    title: string;
                    description: string;
                    price: string;
                    href: string;
                } | {
                    id: string;
                    /** @constant */
                    type: "custom_html";
                    html: string;
                })[][];
            })[];
            raw_html?: string;
        };
        KeyInput: {
            name: string;
            scopes: ("brands:read" | "brands:write" | "emails:read" | "emails:write" | "emails:export" | "audience:read" | "audience:write" | "campaigns:read" | "campaigns:write" | "campaigns:approve" | "campaigns:send" | "integrations:read")[];
            /** @default 90 */
            expires_in_days?: number;
        };
        Mapping: {
            email: string;
            first_name?: string;
            preferred_locale?: string;
            /** @default {} */
            attributes?: {
                [key: string]: string;
            };
            consent_status?: string;
            consent_source?: string;
            consent_timestamp?: string;
            consent_proof?: string;
        };
        FieldInput: {
            key: string;
            label: string;
            /** @enum {string} */
            type: "string" | "number" | "boolean" | "date";
        };
        LocalSessionInput: {
            secret: string;
        };
        Empty: Record<string, never>;
        WorkspaceInput: {
            name: string;
        };
        EmailInput: {
            title: string;
            spec?: components["schemas"]["EmailSpec"];
        };
        GenerateInput: {
            prompt: string;
            /** Format: uuid */
            brand_kit_version_id: string;
            /** Format: uuid */
            base_email_id?: string;
            base_version?: number;
            /** @enum {string} */
            locale?: "en-US" | "en-GB" | "fr-FR" | "de-DE" | "es-ES" | "it-IT" | "pt-BR" | "nl-NL" | "sv-SE" | "da-DK" | "no-NO" | "fi-FI" | "pl-PL" | "cs-CZ" | "tr-TR" | "ja-JP" | "ko-KR" | "zh-CN" | "zh-TW" | "hi-IN" | "ar-SA" | "he-IL";
            /**
             * @default single
             * @enum {string}
             */
            mode?: "single" | "series";
            count?: number;
        };
        DraftInput: {
            spec: components["schemas"]["EmailSpec"];
        };
        RestoreInput: {
            /** Format: uuid */
            revision_id: string;
        };
        PreviewInput: {
            spec: components["schemas"]["EmailSpec"];
        };
        HtmlInput: {
            html: string;
        };
        UrlInput: {
            /** Format: uri */
            url: string;
        };
        NamedInput: {
            name: string;
        };
        ProfileInput: {
            expected_version: number;
            attrs?: {
                [key: string]: string | number | boolean | null;
            };
            list_ids?: string[];
            tag_ids?: string[];
            /** @enum {string} */
            preferred_locale?: "en-US" | "en-GB" | "fr-FR" | "de-DE" | "es-ES" | "it-IT" | "pt-BR" | "nl-NL" | "sv-SE" | "da-DK" | "no-NO" | "fi-FI" | "pl-PL" | "cs-CZ" | "tr-TR" | "ja-JP" | "ko-KR" | "zh-CN" | "zh-TW" | "hi-IN" | "ar-SA" | "he-IL";
        };
        Rule: ({
            /** @enum {string} */
            kind: "tag" | "list";
            /** Format: uuid */
            id: string;
            /** @enum {string} */
            op: "in" | "not_in";
        } | {
            /** @constant */
            kind: "attribute";
            field: string;
            /** @enum {string} */
            op: "eq" | "neq" | "contains" | "gt" | "gte" | "lt" | "lte" | "exists" | "not_exists";
            value?: string | number | boolean;
        } | {
            /** @constant */
            kind: "engagement";
            /** @enum {string} */
            event: "opened" | "clicked" | "delivered";
            /** @enum {string} */
            op: "observed" | "not_observed";
            within_days: number;
        }) | {
            /** @enum {string} */
            kind: "all" | "any";
            children: components["schemas"]["Rule"][];
        };
        SegmentInput: {
            name: string;
            rule: components["schemas"]["Rule"];
        } & {
            [key: string]: unknown;
        };
        SegmentVersionInput: {
            expected_version: number;
            rule: components["schemas"]["Rule"];
        } & {
            [key: string]: unknown;
        };
        VersionInput: {
            expected_version: number;
        };
        InspectInput: {
            csv: string;
        };
        ImportInput: {
            csv: string;
            mapping?: components["schemas"]["Mapping"];
            list_ids?: string[];
            tag_ids?: string[];
        };
        CampaignInput: {
            name: string;
            /** Format: uuid */
            revision_id: string;
        };
        ErrorResponse: {
            request_id: string;
            error: {
                code: string;
                message: string;
                retryable: boolean;
                details?: unknown;
            } & {
                [key: string]: unknown;
            };
        } & {
            [key: string]: unknown;
        };
        Email: {
            /** Format: uuid */
            id: string;
            title: string;
            doc_version: number;
            spec: components["schemas"]["EmailSpec"];
            /** Format: date-time */
            updated_at: string;
            /** Format: date-time */
            created_at?: string;
        } & {
            [key: string]: unknown;
        };
        BrandVersion: {
            /** Format: uuid */
            id: string;
            version: number;
            data: components["schemas"]["Brand"];
            /** Format: date-time */
            created_at: string;
        } & {
            [key: string]: unknown;
        };
        Key: {
            /** Format: uuid */
            id: string;
            name: string;
            prefix: string | null;
            scopes: string[];
            created_by: string;
            /** Format: date-time */
            created_at: string;
            /** Format: date-time */
            expires_at: string;
            revoked_at: string | null;
        } & {
            [key: string]: unknown;
        };
        Revision: {
            /** Format: uuid */
            id: string;
            /** Format: uuid */
            email_id: string;
            revision_no: number;
            subject: string;
            artifact_hash: string;
            /** Format: date-time */
            created_at: string;
        } & {
            [key: string]: unknown;
        };
        Contact: {
            /** Format: uuid */
            id: string;
            email_original: string;
            /** @enum {string} */
            subscription: "subscribed" | "pending_confirmation" | "unsubscribed";
            suppressed: boolean;
            deleted: boolean;
            consent_version: number;
            profile_version: number;
            attrs: {
                [key: string]: unknown;
            };
            list_ids: string[];
            tag_ids: string[];
            preferred_locale: string;
            /** Format: date-time */
            created_at: string;
        } & {
            [key: string]: unknown;
        };
        Campaign: {
            /** Format: uuid */
            id: string;
            name: string;
            state: string;
            /** Format: uuid */
            revision_id: string;
            intent: {
                [key: string]: unknown;
            };
            digest: string;
            /** Format: date-time */
            created_at: string;
        } & {
            [key: string]: unknown;
        };
        Segment: {
            /** Format: uuid */
            id: string;
            name: string;
            current_version: number;
            /** Format: date-time */
            created_at: string;
        } & {
            [key: string]: unknown;
        };
        Audit: {
            /** Format: uuid */
            id: string;
            actor: string;
            action: string;
            resource_id: string | null;
            event_hash: string;
            /** Format: date-time */
            created_at: string;
        } & {
            [key: string]: unknown;
        };
        Operation: {
            /** Format: uuid */
            id: string;
            type: string;
            state: string;
            result?: unknown;
            error?: unknown;
            /** Format: date-time */
            created_at?: string;
        } & {
            [key: string]: unknown;
        };
        EmailsPage: {
            request_id: string;
            data: components["schemas"]["Email"][];
            has_more: boolean;
            next_cursor: string | null;
            total_count: number;
        } & {
            [key: string]: unknown;
        };
        BrandsPage: {
            request_id: string;
            data: components["schemas"]["BrandVersion"][];
            has_more: boolean;
            next_cursor: string | null;
            total_count: number;
        } & {
            [key: string]: unknown;
        };
        KeysPage: {
            request_id: string;
            data: components["schemas"]["Key"][];
            has_more: boolean;
            next_cursor: string | null;
            total_count: number;
        } & {
            [key: string]: unknown;
        };
        RevisionsPage: {
            request_id: string;
            data: components["schemas"]["Revision"][];
            has_more: boolean;
            next_cursor: string | null;
            total_count: number;
        } & {
            [key: string]: unknown;
        };
        ContactsPage: {
            request_id: string;
            data: components["schemas"]["Contact"][];
            has_more: boolean;
            next_cursor: string | null;
            total_count: number;
        } & {
            [key: string]: unknown;
        };
        CampaignsPage: {
            request_id: string;
            data: components["schemas"]["Campaign"][];
            has_more: boolean;
            next_cursor: string | null;
            total_count: number;
        } & {
            [key: string]: unknown;
        };
        SegmentsPage: {
            request_id: string;
            data: components["schemas"]["Segment"][];
            has_more: boolean;
            next_cursor: string | null;
            total_count: number;
        } & {
            [key: string]: unknown;
        };
        AuditPage: {
            request_id: string;
            data: components["schemas"]["Audit"][];
            has_more: boolean;
            next_cursor: string | null;
            total_count: number;
        } & {
            [key: string]: unknown;
        };
        EmailResponse: {
            request_id: string;
            email: components["schemas"]["Email"];
        } & {
            [key: string]: unknown;
        };
        BrandResponse: {
            request_id: string;
            brand: components["schemas"]["BrandVersion"];
        } & {
            [key: string]: unknown;
        };
        CurrentBrandResponse: {
            request_id: string;
            brand: components["schemas"]["BrandVersion"] | null;
        } & {
            [key: string]: unknown;
        };
        OperationResponse: {
            request_id: string;
            operation: components["schemas"]["Operation"];
        } & {
            [key: string]: unknown;
        };
        RevisionResponse: {
            request_id: string;
            revision: {
                [key: string]: unknown;
            };
        } & {
            [key: string]: unknown;
        };
        KeyResponse: {
            request_id: string;
            key: components["schemas"]["Key"];
            secret?: string;
            secret_available: boolean;
        } & {
            [key: string]: unknown;
        };
        GenericResponse: {
            request_id: string;
        } & {
            [key: string]: unknown;
        };
        CampaignResponse: {
            request_id: string;
            campaign: components["schemas"]["Campaign"];
        } & {
            [key: string]: unknown;
        };
        Health: {
            request_id: string;
            /** @constant */
            status: "ok";
            /** @constant */
            release: "development";
            /** @constant */
            dispatch_enabled: false;
        } & {
            [key: string]: unknown;
        };
    };
    responses: never;
    parameters: never;
    requestBodies: never;
    headers: never;
    pathItems: never;
}
export type $defs = Record<string, never>;
export interface operations {
    health: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Acknowledged result */
            200: {
                headers: {
                    "X-Request-Id"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Health"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            405: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            428: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            429: {
                headers: {
                    /** @description Minimum seconds before retry */
                    "Retry-After"?: string;
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "RATE_LIMITED",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": true
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": true
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    listWorkspaces: {
        parameters: {
            query?: never;
            header?: {
                /** @description Required for tenant session requests; bearer keys cannot override their workspace. */
                "X-Workspace-Id"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Acknowledged result */
            200: {
                headers: {
                    "X-Request-Id"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["GenericResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            405: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            428: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            429: {
                headers: {
                    /** @description Minimum seconds before retry */
                    "Retry-After"?: string;
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "RATE_LIMITED",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": true
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": true
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    createWorkspace: {
        parameters: {
            query?: never;
            header?: {
                /** @description Required for tenant session requests; bearer keys cannot override their workspace. */
                "X-Workspace-Id"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                /**
                 * @example {
                 *       "name": "Example workspace"
                 *     }
                 */
                "application/json": components["schemas"]["WorkspaceInput"];
            };
        };
        responses: {
            /** @description Acknowledged result */
            201: {
                headers: {
                    "X-Request-Id"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["GenericResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            405: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            428: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            429: {
                headers: {
                    /** @description Minimum seconds before retry */
                    "Retry-After"?: string;
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "RATE_LIMITED",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": true
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": true
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    signOutLocalSession: {
        parameters: {
            query?: never;
            header?: {
                /** @description Required for tenant session requests; bearer keys cannot override their workspace. */
                "X-Workspace-Id"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Acknowledged result */
            200: {
                headers: {
                    "X-Request-Id"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["GenericResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            405: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            428: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            429: {
                headers: {
                    /** @description Minimum seconds before retry */
                    "Retry-After"?: string;
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "RATE_LIMITED",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": true
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": true
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    localSession: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                /**
                 * @example {
                 *       "secret": "example-only-never-a-real-secret"
                 *     }
                 */
                "application/json": components["schemas"]["LocalSessionInput"];
            };
        };
        responses: {
            /** @description Acknowledged result */
            200: {
                headers: {
                    "X-Request-Id"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["GenericResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            405: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            428: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            429: {
                headers: {
                    /** @description Minimum seconds before retry */
                    "Retry-After"?: string;
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "RATE_LIMITED",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": true
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": true
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    listIntegrations: {
        parameters: {
            query?: never;
            header?: {
                /** @description Required for tenant session requests; bearer keys cannot override their workspace. */
                "X-Workspace-Id"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Acknowledged result */
            200: {
                headers: {
                    "X-Request-Id"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["GenericResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            405: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            428: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            429: {
                headers: {
                    /** @description Minimum seconds before retry */
                    "Retry-After"?: string;
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "RATE_LIMITED",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": true
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": true
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    listBrands: {
        parameters: {
            query?: {
                limit?: number;
                /** @description Opaque signed cursor bound to account, workspace, resource and filters; expires in15minutes. */
                after?: string;
                /** @description UTC instant; inclusive lower/exclusive upper bound. Keep unchanged while following pages. */
                created_after?: string;
                /** @description UTC instant; inclusive lower/exclusive upper bound. Keep unchanged while following pages. */
                created_before?: string;
            };
            header?: {
                /** @description Required for tenant session requests; bearer keys cannot override their workspace. */
                "X-Workspace-Id"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Acknowledged result */
            200: {
                headers: {
                    "X-Request-Id"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BrandsPage"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            405: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            428: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            429: {
                headers: {
                    /** @description Minimum seconds before retry */
                    "Retry-After"?: string;
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "RATE_LIMITED",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": true
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": true
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    confirmBrand: {
        parameters: {
            query?: never;
            header: {
                /** @description Required for tenant session requests; bearer keys cannot override their workspace. */
                "X-Workspace-Id"?: string;
                /** @description Keep the same key and exact payload during uncertain recovery; mismatch409. Raw key secret is never stored in receipts. */
                "Idempotency-Key": string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                /**
                 * @example {
                 *       "name": "Example brand",
                 *       "website": "https://example.com",
                 *       "description": "Example description",
                 *       "voice": "Clear",
                 *       "accent": "#0B625D",
                 *       "background": "#F7F6F2",
                 *       "font_stack": "Arial, sans-serif",
                 *       "address": "Example postal address",
                 *       "forbidden_phrases": [],
                 *       "approved_claims": [],
                 *       "provenance": []
                 *     }
                 */
                "application/json": components["schemas"]["Brand"];
            };
        };
        responses: {
            /** @description Acknowledged result */
            201: {
                headers: {
                    "X-Request-Id"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BrandResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            405: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            428: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            429: {
                headers: {
                    /** @description Minimum seconds before retry */
                    "Retry-After"?: string;
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "RATE_LIMITED",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": true
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": true
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    listEmails: {
        parameters: {
            query?: {
                limit?: number;
                /** @description Opaque signed cursor bound to account, workspace, resource and filters; expires in15minutes. */
                after?: string;
                /** @description UTC instant; inclusive lower/exclusive upper bound. Keep unchanged while following pages. */
                created_after?: string;
                /** @description UTC instant; inclusive lower/exclusive upper bound. Keep unchanged while following pages. */
                created_before?: string;
            };
            header?: {
                /** @description Required for tenant session requests; bearer keys cannot override their workspace. */
                "X-Workspace-Id"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Acknowledged result */
            200: {
                headers: {
                    "X-Request-Id"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["EmailsPage"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            405: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            428: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            429: {
                headers: {
                    /** @description Minimum seconds before retry */
                    "Retry-After"?: string;
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "RATE_LIMITED",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": true
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": true
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    createEmail: {
        parameters: {
            query?: never;
            header: {
                /** @description Required for tenant session requests; bearer keys cannot override their workspace. */
                "X-Workspace-Id"?: string;
                /** @description Keep the same key and exact payload during uncertain recovery; mismatch409. Raw key secret is never stored in receipts. */
                "Idempotency-Key": string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                /**
                 * @example {
                 *       "title": "Example draft"
                 *     }
                 */
                "application/json": components["schemas"]["EmailInput"];
            };
        };
        responses: {
            /** @description Acknowledged result */
            200: {
                headers: {
                    "X-Request-Id"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["EmailResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            405: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            428: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            429: {
                headers: {
                    /** @description Minimum seconds before retry */
                    "Retry-After"?: string;
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "RATE_LIMITED",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": true
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": true
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    listContacts: {
        parameters: {
            query?: {
                limit?: number;
                /** @description Opaque signed cursor bound to account, workspace, resource and filters; expires in15minutes. */
                after?: string;
                /** @description UTC instant; inclusive lower/exclusive upper bound. Keep unchanged while following pages. */
                created_after?: string;
                /** @description UTC instant; inclusive lower/exclusive upper bound. Keep unchanged while following pages. */
                created_before?: string;
            };
            header?: {
                /** @description Required for tenant session requests; bearer keys cannot override their workspace. */
                "X-Workspace-Id"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Acknowledged result */
            200: {
                headers: {
                    "X-Request-Id"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ContactsPage"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            405: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            428: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            429: {
                headers: {
                    /** @description Minimum seconds before retry */
                    "Retry-After"?: string;
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "RATE_LIMITED",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": true
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": true
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    listCampaigns: {
        parameters: {
            query?: {
                limit?: number;
                /** @description Opaque signed cursor bound to account, workspace, resource and filters; expires in15minutes. */
                after?: string;
                /** @description UTC instant; inclusive lower/exclusive upper bound. Keep unchanged while following pages. */
                created_after?: string;
                /** @description UTC instant; inclusive lower/exclusive upper bound. Keep unchanged while following pages. */
                created_before?: string;
            };
            header?: {
                /** @description Required for tenant session requests; bearer keys cannot override their workspace. */
                "X-Workspace-Id"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Acknowledged result */
            200: {
                headers: {
                    "X-Request-Id"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CampaignsPage"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            405: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            428: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            429: {
                headers: {
                    /** @description Minimum seconds before retry */
                    "Retry-After"?: string;
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "RATE_LIMITED",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": true
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": true
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    createCampaign: {
        parameters: {
            query?: never;
            header: {
                /** @description Required for tenant session requests; bearer keys cannot override their workspace. */
                "X-Workspace-Id"?: string;
                /** @description Keep the same key and exact payload during uncertain recovery; mismatch409. Raw key secret is never stored in receipts. */
                "Idempotency-Key": string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                /**
                 * @example {
                 *       "name": "Example campaign",
                 *       "revision_id": "11111111-1111-4111-8111-111111111111"
                 *     }
                 */
                "application/json": components["schemas"]["CampaignInput"];
            };
        };
        responses: {
            /** @description Acknowledged result */
            200: {
                headers: {
                    "X-Request-Id"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CampaignResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            405: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            428: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            429: {
                headers: {
                    /** @description Minimum seconds before retry */
                    "Retry-After"?: string;
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "RATE_LIMITED",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": true
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": true
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    listSegments: {
        parameters: {
            query?: {
                limit?: number;
                /** @description Opaque signed cursor bound to account, workspace, resource and filters; expires in15minutes. */
                after?: string;
                /** @description UTC instant; inclusive lower/exclusive upper bound. Keep unchanged while following pages. */
                created_after?: string;
                /** @description UTC instant; inclusive lower/exclusive upper bound. Keep unchanged while following pages. */
                created_before?: string;
            };
            header?: {
                /** @description Required for tenant session requests; bearer keys cannot override their workspace. */
                "X-Workspace-Id"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Acknowledged result */
            200: {
                headers: {
                    "X-Request-Id"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SegmentsPage"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            405: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            428: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            429: {
                headers: {
                    /** @description Minimum seconds before retry */
                    "Retry-After"?: string;
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "RATE_LIMITED",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": true
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": true
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    createSegment: {
        parameters: {
            query?: never;
            header: {
                /** @description Required for tenant session requests; bearer keys cannot override their workspace. */
                "X-Workspace-Id"?: string;
                /** @description Keep the same key and exact payload during uncertain recovery; mismatch409. Raw key secret is never stored in receipts. */
                "Idempotency-Key": string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                /**
                 * @example {
                 *       "name": "Named contacts",
                 *       "rule": {
                 *         "kind": "attribute",
                 *         "field": "first_name",
                 *         "op": "exists"
                 *       }
                 *     }
                 */
                "application/json": components["schemas"]["SegmentInput"];
            };
        };
        responses: {
            /** @description Acknowledged result */
            200: {
                headers: {
                    "X-Request-Id"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["GenericResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            405: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            428: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            429: {
                headers: {
                    /** @description Minimum seconds before retry */
                    "Retry-After"?: string;
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "RATE_LIMITED",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": true
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": true
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    listApiKeys: {
        parameters: {
            query?: {
                limit?: number;
                /** @description Opaque signed cursor bound to account, workspace, resource and filters; expires in15minutes. */
                after?: string;
                /** @description UTC instant; inclusive lower/exclusive upper bound. Keep unchanged while following pages. */
                created_after?: string;
                /** @description UTC instant; inclusive lower/exclusive upper bound. Keep unchanged while following pages. */
                created_before?: string;
            };
            header?: {
                /** @description Required for tenant session requests; bearer keys cannot override their workspace. */
                "X-Workspace-Id"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Acknowledged result */
            200: {
                headers: {
                    "X-Request-Id"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["KeysPage"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            405: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            428: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            429: {
                headers: {
                    /** @description Minimum seconds before retry */
                    "Retry-After"?: string;
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "RATE_LIMITED",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": true
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": true
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    createApiKey: {
        parameters: {
            query?: never;
            header: {
                /** @description Required for tenant session requests; bearer keys cannot override their workspace. */
                "X-Workspace-Id"?: string;
                /** @description Keep the same key and exact payload during uncertain recovery; mismatch409. Raw key secret is never stored in receipts. */
                "Idempotency-Key": string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                /**
                 * @example {
                 *       "name": "Example reader",
                 *       "scopes": [
                 *         "emails:read"
                 *       ],
                 *       "expires_in_days": 90
                 *     }
                 */
                "application/json": components["schemas"]["KeyInput"];
            };
        };
        responses: {
            /** @description Acknowledged result */
            201: {
                headers: {
                    "X-Request-Id"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["KeyResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            405: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            428: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            429: {
                headers: {
                    /** @description Minimum seconds before retry */
                    "Retry-After"?: string;
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "RATE_LIMITED",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": true
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": true
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    listAudit: {
        parameters: {
            query?: {
                limit?: number;
                /** @description Opaque signed cursor bound to account, workspace, resource and filters; expires in15minutes. */
                after?: string;
                /** @description UTC instant; inclusive lower/exclusive upper bound. Keep unchanged while following pages. */
                created_after?: string;
                /** @description UTC instant; inclusive lower/exclusive upper bound. Keep unchanged while following pages. */
                created_before?: string;
            };
            header?: {
                /** @description Required for tenant session requests; bearer keys cannot override their workspace. */
                "X-Workspace-Id"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Acknowledged result */
            200: {
                headers: {
                    "X-Request-Id"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuditPage"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            405: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            428: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            429: {
                headers: {
                    /** @description Minimum seconds before retry */
                    "Retry-After"?: string;
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "RATE_LIMITED",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": true
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": true
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    listRevisions: {
        parameters: {
            query?: {
                limit?: number;
                /** @description Opaque signed cursor bound to account, workspace, resource and filters; expires in15minutes. */
                after?: string;
                /** @description UTC instant; inclusive lower/exclusive upper bound. Keep unchanged while following pages. */
                created_after?: string;
                /** @description UTC instant; inclusive lower/exclusive upper bound. Keep unchanged while following pages. */
                created_before?: string;
                email_id?: string;
            };
            header?: {
                /** @description Required for tenant session requests; bearer keys cannot override their workspace. */
                "X-Workspace-Id"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Acknowledged result */
            200: {
                headers: {
                    "X-Request-Id"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["RevisionsPage"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            405: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            428: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            429: {
                headers: {
                    /** @description Minimum seconds before retry */
                    "Retry-After"?: string;
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "RATE_LIMITED",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": true
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": true
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    getCurrentBrand: {
        parameters: {
            query?: never;
            header?: {
                /** @description Required for tenant session requests; bearer keys cannot override their workspace. */
                "X-Workspace-Id"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Acknowledged result */
            200: {
                headers: {
                    "X-Request-Id"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CurrentBrandResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            405: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            428: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            429: {
                headers: {
                    /** @description Minimum seconds before retry */
                    "Retry-After"?: string;
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "RATE_LIMITED",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": true
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": true
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    extractBrand: {
        parameters: {
            query?: never;
            header: {
                /** @description Required for tenant session requests; bearer keys cannot override their workspace. */
                "X-Workspace-Id"?: string;
                /** @description Keep the same key and exact payload during uncertain recovery; mismatch409. Raw key secret is never stored in receipts. */
                "Idempotency-Key": string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                /**
                 * @example {
                 *       "url": "https://example.com"
                 *     }
                 */
                "application/json": components["schemas"]["UrlInput"];
            };
        };
        responses: {
            /** @description Acknowledged result */
            202: {
                headers: {
                    "X-Request-Id"?: string;
                    Location?: string;
                    "Retry-After"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["OperationResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            405: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            428: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            429: {
                headers: {
                    /** @description Minimum seconds before retry */
                    "Retry-After"?: string;
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "RATE_LIMITED",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": true
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": true
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    getEmail: {
        parameters: {
            query?: never;
            header?: {
                /** @description Required for tenant session requests; bearer keys cannot override their workspace. */
                "X-Workspace-Id"?: string;
            };
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Acknowledged result */
            200: {
                headers: {
                    "X-Request-Id"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["EmailResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            405: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            428: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            429: {
                headers: {
                    /** @description Minimum seconds before retry */
                    "Retry-After"?: string;
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "RATE_LIMITED",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": true
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": true
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    generateEmail: {
        parameters: {
            query?: never;
            header: {
                /** @description Required for tenant session requests; bearer keys cannot override their workspace. */
                "X-Workspace-Id"?: string;
                /** @description Keep the same key and exact payload during uncertain recovery; mismatch409. Raw key secret is never stored in receipts. */
                "Idempotency-Key": string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                /**
                 * @example {
                 *       "prompt": "Write an email with approved facts",
                 *       "brand_kit_version_id": "11111111-1111-4111-8111-111111111111",
                 *       "locale": "en-US",
                 *       "mode": "single"
                 *     }
                 */
                "application/json": components["schemas"]["GenerateInput"];
            };
        };
        responses: {
            /** @description Acknowledged result */
            202: {
                headers: {
                    "X-Request-Id"?: string;
                    Location?: string;
                    "Retry-After"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["OperationResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            405: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            428: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            429: {
                headers: {
                    /** @description Minimum seconds before retry */
                    "Retry-After"?: string;
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "RATE_LIMITED",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": true
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": true
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    saveDraft: {
        parameters: {
            query?: never;
            header: {
                /** @description Required for tenant session requests; bearer keys cannot override their workspace. */
                "X-Workspace-Id"?: string;
                /** @description Acknowledged draft version; stale412, absent428. */
                "If-Match": string;
            };
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                /**
                 * @example {
                 *       "spec": {
                 *         "schema_version": "1.0",
                 *         "editing_mode": "structured",
                 *         "locale": "en-US",
                 *         "direction": "ltr",
                 *         "subject": "",
                 *         "preheader": "",
                 *         "brand_kit_version_id": "11111111-1111-4111-8111-111111111111",
                 *         "theme": {
                 *           "content_width_px": 600,
                 *           "background": "#F7F6F2",
                 *           "accent": "#0B625D",
                 *           "font_stack": "Arial, sans-serif"
                 *         },
                 *         "sections": [
                 *           {
                 *             "id": "hero",
                 *             "type": "hero",
                 *             "heading": "Your next story starts here",
                 *             "text": "Add the offer, details and approved facts your readers need."
                 *           },
                 *           {
                 *             "id": "body",
                 *             "type": "text",
                 *             "text": "Write something worth opening."
                 *           },
                 *           {
                 *             "id": "cta",
                 *             "type": "button",
                 *             "label": "Explore",
                 *             "href": "https://example.com"
                 *           },
                 *           {
                 *             "id": "footer",
                 *             "type": "legal_footer",
                 *             "identity": "Example brand",
                 *             "address": "",
                 *             "unsubscribe_slot": true
                 *           }
                 *         ]
                 *       }
                 *     }
                 */
                "application/json": components["schemas"]["DraftInput"];
            };
        };
        responses: {
            /** @description Acknowledged result */
            200: {
                headers: {
                    "X-Request-Id"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["EmailResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            405: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            428: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            429: {
                headers: {
                    /** @description Minimum seconds before retry */
                    "Retry-After"?: string;
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "RATE_LIMITED",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": true
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": true
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    checkpointEmail: {
        parameters: {
            query?: never;
            header: {
                /** @description Required for tenant session requests; bearer keys cannot override their workspace. */
                "X-Workspace-Id"?: string;
                /** @description Keep the same key and exact payload during uncertain recovery; mismatch409. Raw key secret is never stored in receipts. */
                "Idempotency-Key": string;
                /** @description Acknowledged draft version; stale412, absent428. */
                "If-Match": string;
            };
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                /** @example {} */
                "application/json": components["schemas"]["Empty"];
            };
        };
        responses: {
            /** @description Acknowledged result */
            200: {
                headers: {
                    "X-Request-Id"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["RevisionResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            405: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            428: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            429: {
                headers: {
                    /** @description Minimum seconds before retry */
                    "Retry-After"?: string;
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "RATE_LIMITED",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": true
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": true
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    restoreEmail: {
        parameters: {
            query?: never;
            header: {
                /** @description Required for tenant session requests; bearer keys cannot override their workspace. */
                "X-Workspace-Id"?: string;
                /** @description Keep the same key and exact payload during uncertain recovery; mismatch409. Raw key secret is never stored in receipts. */
                "Idempotency-Key": string;
                /** @description Acknowledged draft version; stale412, absent428. */
                "If-Match": string;
            };
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                /**
                 * @example {
                 *       "revision_id": "11111111-1111-4111-8111-111111111111"
                 *     }
                 */
                "application/json": components["schemas"]["RestoreInput"];
            };
        };
        responses: {
            /** @description Acknowledged result */
            200: {
                headers: {
                    "X-Request-Id"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["EmailResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            405: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            428: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            429: {
                headers: {
                    /** @description Minimum seconds before retry */
                    "Retry-After"?: string;
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "RATE_LIMITED",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": true
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": true
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    previewEmail: {
        parameters: {
            query?: never;
            header?: {
                /** @description Required for tenant session requests; bearer keys cannot override their workspace. */
                "X-Workspace-Id"?: string;
            };
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                /**
                 * @example {
                 *       "spec": {
                 *         "schema_version": "1.0",
                 *         "editing_mode": "structured",
                 *         "locale": "en-US",
                 *         "direction": "ltr",
                 *         "subject": "",
                 *         "preheader": "",
                 *         "brand_kit_version_id": "11111111-1111-4111-8111-111111111111",
                 *         "theme": {
                 *           "content_width_px": 600,
                 *           "background": "#F7F6F2",
                 *           "accent": "#0B625D",
                 *           "font_stack": "Arial, sans-serif"
                 *         },
                 *         "sections": [
                 *           {
                 *             "id": "hero",
                 *             "type": "hero",
                 *             "heading": "Your next story starts here",
                 *             "text": "Add the offer, details and approved facts your readers need."
                 *           },
                 *           {
                 *             "id": "body",
                 *             "type": "text",
                 *             "text": "Write something worth opening."
                 *           },
                 *           {
                 *             "id": "cta",
                 *             "type": "button",
                 *             "label": "Explore",
                 *             "href": "https://example.com"
                 *           },
                 *           {
                 *             "id": "footer",
                 *             "type": "legal_footer",
                 *             "identity": "Example brand",
                 *             "address": "",
                 *             "unsubscribe_slot": true
                 *           }
                 *         ]
                 *       }
                 *     }
                 */
                "application/json": components["schemas"]["PreviewInput"];
            };
        };
        responses: {
            /** @description Acknowledged result */
            200: {
                headers: {
                    "X-Request-Id"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["GenericResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            405: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            428: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            429: {
                headers: {
                    /** @description Minimum seconds before retry */
                    "Retry-After"?: string;
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "RATE_LIMITED",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": true
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": true
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    importHtml: {
        parameters: {
            query?: never;
            header: {
                /** @description Required for tenant session requests; bearer keys cannot override their workspace. */
                "X-Workspace-Id"?: string;
                /** @description Acknowledged draft version; stale412, absent428. */
                "If-Match": string;
            };
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                /**
                 * @example {
                 *       "html": "<p>Example</p>"
                 *     }
                 */
                "application/json": components["schemas"]["HtmlInput"];
            };
        };
        responses: {
            /** @description Acknowledged result */
            200: {
                headers: {
                    "X-Request-Id"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["EmailResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            405: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            428: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            429: {
                headers: {
                    /** @description Minimum seconds before retry */
                    "Retry-After"?: string;
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "RATE_LIMITED",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": true
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": true
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    downloadRevision: {
        parameters: {
            query?: {
                format?: "html" | "txt" | "png" | "pdf";
            };
            header?: {
                /** @description Required for tenant session requests; bearer keys cannot override their workspace. */
                "X-Workspace-Id"?: string;
            };
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Frozen bytes; browser image/PDF simulations, not real-client evidence. */
            200: {
                headers: {
                    "X-Request-Id"?: string;
                    "X-Artifact-Hash"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/octet-stream": string;
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            405: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            428: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            429: {
                headers: {
                    /** @description Minimum seconds before retry */
                    "Retry-After"?: string;
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "RATE_LIMITED",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": true
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": true
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    preflightRevision: {
        parameters: {
            query?: never;
            header: {
                /** @description Required for tenant session requests; bearer keys cannot override their workspace. */
                "X-Workspace-Id"?: string;
                /** @description Keep the same key and exact payload during uncertain recovery; mismatch409. Raw key secret is never stored in receipts. */
                "Idempotency-Key": string;
            };
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                /** @example {} */
                "application/json": components["schemas"]["Empty"];
            };
        };
        responses: {
            /** @description Acknowledged result */
            200: {
                headers: {
                    "X-Request-Id"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["GenericResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            405: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            428: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            429: {
                headers: {
                    /** @description Minimum seconds before retry */
                    "Retry-After"?: string;
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "RATE_LIMITED",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": true
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": true
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    exportRevision: {
        parameters: {
            query?: never;
            header: {
                /** @description Required for tenant session requests; bearer keys cannot override their workspace. */
                "X-Workspace-Id"?: string;
                /** @description Keep the same key and exact payload during uncertain recovery; mismatch409. Raw key secret is never stored in receipts. */
                "Idempotency-Key": string;
            };
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                /** @example {} */
                "application/json": components["schemas"]["Empty"];
            };
        };
        responses: {
            /** @description Reserved shape; the current development command always returns a documented provider/release error. */
            200: {
                headers: {
                    "X-Request-Id"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["GenericResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            405: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            428: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            429: {
                headers: {
                    /** @description Minimum seconds before retry */
                    "Retry-After"?: string;
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "RATE_LIMITED",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": true
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": true
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    getOperation: {
        parameters: {
            query?: never;
            header?: {
                /** @description Required for tenant session requests; bearer keys cannot override their workspace. */
                "X-Workspace-Id"?: string;
            };
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Acknowledged result */
            200: {
                headers: {
                    "X-Request-Id"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["OperationResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            405: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            428: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            429: {
                headers: {
                    /** @description Minimum seconds before retry */
                    "Retry-After"?: string;
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "RATE_LIMITED",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": true
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": true
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    cancelOperation: {
        parameters: {
            query?: never;
            header?: {
                /** @description Required for tenant session requests; bearer keys cannot override their workspace. */
                "X-Workspace-Id"?: string;
            };
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                /** @example {} */
                "application/json": components["schemas"]["Empty"];
            };
        };
        responses: {
            /** @description Acknowledged result */
            200: {
                headers: {
                    "X-Request-Id"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["OperationResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            405: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            428: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            429: {
                headers: {
                    /** @description Minimum seconds before retry */
                    "Retry-After"?: string;
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "RATE_LIMITED",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": true
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": true
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    getAudienceSchema: {
        parameters: {
            query?: never;
            header?: {
                /** @description Required for tenant session requests; bearer keys cannot override their workspace. */
                "X-Workspace-Id"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Acknowledged result */
            200: {
                headers: {
                    "X-Request-Id"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["GenericResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            405: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            428: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            429: {
                headers: {
                    /** @description Minimum seconds before retry */
                    "Retry-After"?: string;
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "RATE_LIMITED",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": true
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": true
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    createList: {
        parameters: {
            query?: never;
            header: {
                /** @description Required for tenant session requests; bearer keys cannot override their workspace. */
                "X-Workspace-Id"?: string;
                /** @description Keep the same key and exact payload during uncertain recovery; mismatch409. Raw key secret is never stored in receipts. */
                "Idempotency-Key": string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                /**
                 * @example {
                 *       "name": "Example list"
                 *     }
                 */
                "application/json": components["schemas"]["NamedInput"];
            };
        };
        responses: {
            /** @description Acknowledged result */
            200: {
                headers: {
                    "X-Request-Id"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["GenericResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            405: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            428: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            429: {
                headers: {
                    /** @description Minimum seconds before retry */
                    "Retry-After"?: string;
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "RATE_LIMITED",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": true
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": true
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    createTag: {
        parameters: {
            query?: never;
            header: {
                /** @description Required for tenant session requests; bearer keys cannot override their workspace. */
                "X-Workspace-Id"?: string;
                /** @description Keep the same key and exact payload during uncertain recovery; mismatch409. Raw key secret is never stored in receipts. */
                "Idempotency-Key": string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                /**
                 * @example {
                 *       "name": "Example list"
                 *     }
                 */
                "application/json": components["schemas"]["NamedInput"];
            };
        };
        responses: {
            /** @description Acknowledged result */
            200: {
                headers: {
                    "X-Request-Id"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["GenericResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            405: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            428: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            429: {
                headers: {
                    /** @description Minimum seconds before retry */
                    "Retry-After"?: string;
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "RATE_LIMITED",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": true
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": true
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    createContactField: {
        parameters: {
            query?: never;
            header: {
                /** @description Required for tenant session requests; bearer keys cannot override their workspace. */
                "X-Workspace-Id"?: string;
                /** @description Keep the same key and exact payload during uncertain recovery; mismatch409. Raw key secret is never stored in receipts. */
                "Idempotency-Key": string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                /**
                 * @example {
                 *       "key": "score",
                 *       "label": "Score",
                 *       "type": "number"
                 *     }
                 */
                "application/json": components["schemas"]["FieldInput"];
            };
        };
        responses: {
            /** @description Acknowledged result */
            200: {
                headers: {
                    "X-Request-Id"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["GenericResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            405: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            428: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            429: {
                headers: {
                    /** @description Minimum seconds before retry */
                    "Retry-After"?: string;
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "RATE_LIMITED",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": true
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": true
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    updateContactProfile: {
        parameters: {
            query?: never;
            header: {
                /** @description Required for tenant session requests; bearer keys cannot override their workspace. */
                "X-Workspace-Id"?: string;
                /** @description Keep the same key and exact payload during uncertain recovery; mismatch409. Raw key secret is never stored in receipts. */
                "Idempotency-Key": string;
            };
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                /**
                 * @example {
                 *       "expected_version": 1,
                 *       "attrs": {
                 *         "first_name": "Example"
                 *       }
                 *     }
                 */
                "application/json": components["schemas"]["ProfileInput"];
            };
        };
        responses: {
            /** @description Acknowledged result */
            200: {
                headers: {
                    "X-Request-Id"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["GenericResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            405: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            428: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            429: {
                headers: {
                    /** @description Minimum seconds before retry */
                    "Retry-After"?: string;
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "RATE_LIMITED",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": true
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": true
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    suppressContact: {
        parameters: {
            query?: never;
            header: {
                /** @description Required for tenant session requests; bearer keys cannot override their workspace. */
                "X-Workspace-Id"?: string;
                /** @description Keep the same key and exact payload during uncertain recovery; mismatch409. Raw key secret is never stored in receipts. */
                "Idempotency-Key": string;
            };
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                /** @example {} */
                "application/json": components["schemas"]["Empty"];
            };
        };
        responses: {
            /** @description Acknowledged result */
            200: {
                headers: {
                    "X-Request-Id"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["GenericResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            405: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            428: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            429: {
                headers: {
                    /** @description Minimum seconds before retry */
                    "Retry-After"?: string;
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "RATE_LIMITED",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": true
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": true
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    getSegment: {
        parameters: {
            query?: never;
            header?: {
                /** @description Required for tenant session requests; bearer keys cannot override their workspace. */
                "X-Workspace-Id"?: string;
            };
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Acknowledged result */
            200: {
                headers: {
                    "X-Request-Id"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["GenericResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            405: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            428: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            429: {
                headers: {
                    /** @description Minimum seconds before retry */
                    "Retry-After"?: string;
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "RATE_LIMITED",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": true
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": true
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    createSegmentVersion: {
        parameters: {
            query?: never;
            header: {
                /** @description Required for tenant session requests; bearer keys cannot override their workspace. */
                "X-Workspace-Id"?: string;
                /** @description Keep the same key and exact payload during uncertain recovery; mismatch409. Raw key secret is never stored in receipts. */
                "Idempotency-Key": string;
            };
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                /**
                 * @example {
                 *       "expected_version": 1,
                 *       "rule": {
                 *         "kind": "attribute",
                 *         "field": "first_name",
                 *         "op": "exists"
                 *       }
                 *     }
                 */
                "application/json": components["schemas"]["SegmentVersionInput"];
            };
        };
        responses: {
            /** @description Acknowledged result */
            200: {
                headers: {
                    "X-Request-Id"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["GenericResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            405: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            428: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            429: {
                headers: {
                    /** @description Minimum seconds before retry */
                    "Retry-After"?: string;
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "RATE_LIMITED",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": true
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": true
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    previewSegment: {
        parameters: {
            query?: never;
            header?: {
                /** @description Required for tenant session requests; bearer keys cannot override their workspace. */
                "X-Workspace-Id"?: string;
            };
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                /**
                 * @example {
                 *       "expected_version": 1
                 *     }
                 */
                "application/json": components["schemas"]["VersionInput"];
            };
        };
        responses: {
            /** @description Acknowledged result */
            200: {
                headers: {
                    "X-Request-Id"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["GenericResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            405: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            428: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            429: {
                headers: {
                    /** @description Minimum seconds before retry */
                    "Retry-After"?: string;
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "RATE_LIMITED",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": true
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": true
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    freezeAudience: {
        parameters: {
            query?: never;
            header: {
                /** @description Required for tenant session requests; bearer keys cannot override their workspace. */
                "X-Workspace-Id"?: string;
                /** @description Keep the same key and exact payload during uncertain recovery; mismatch409. Raw key secret is never stored in receipts. */
                "Idempotency-Key": string;
            };
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                /**
                 * @example {
                 *       "expected_version": 1
                 *     }
                 */
                "application/json": components["schemas"]["VersionInput"];
            };
        };
        responses: {
            /** @description Acknowledged result */
            200: {
                headers: {
                    "X-Request-Id"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["GenericResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            405: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            428: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            429: {
                headers: {
                    /** @description Minimum seconds before retry */
                    "Retry-After"?: string;
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "RATE_LIMITED",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": true
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": true
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    getAudienceSnapshot: {
        parameters: {
            query?: never;
            header?: {
                /** @description Required for tenant session requests; bearer keys cannot override their workspace. */
                "X-Workspace-Id"?: string;
            };
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Acknowledged result */
            200: {
                headers: {
                    "X-Request-Id"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["GenericResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            405: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            428: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            429: {
                headers: {
                    /** @description Minimum seconds before retry */
                    "Retry-After"?: string;
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "RATE_LIMITED",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": true
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": true
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    inspectImport: {
        parameters: {
            query?: never;
            header?: {
                /** @description Required for tenant session requests; bearer keys cannot override their workspace. */
                "X-Workspace-Id"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                /**
                 * @example {
                 *       "csv": "email\nfixture@example.com"
                 *     }
                 */
                "application/json": components["schemas"]["InspectInput"];
            };
        };
        responses: {
            /** @description Acknowledged result */
            200: {
                headers: {
                    "X-Request-Id"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["GenericResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            405: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            428: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            429: {
                headers: {
                    /** @description Minimum seconds before retry */
                    "Retry-After"?: string;
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "RATE_LIMITED",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": true
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": true
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    dryRunImport: {
        parameters: {
            query?: never;
            header: {
                /** @description Required for tenant session requests; bearer keys cannot override their workspace. */
                "X-Workspace-Id"?: string;
                /** @description Keep the same key and exact payload during uncertain recovery; mismatch409. Raw key secret is never stored in receipts. */
                "Idempotency-Key": string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                /**
                 * @example {
                 *       "csv": "email\nfixture@example.com",
                 *       "mapping": {
                 *         "email": "email",
                 *         "attributes": {}
                 *       }
                 *     }
                 */
                "application/json": components["schemas"]["ImportInput"];
            };
        };
        responses: {
            /** @description Acknowledged result */
            200: {
                headers: {
                    "X-Request-Id"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["GenericResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            405: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            428: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            429: {
                headers: {
                    /** @description Minimum seconds before retry */
                    "Retry-After"?: string;
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "RATE_LIMITED",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": true
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": true
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    confirmImport: {
        parameters: {
            query?: never;
            header: {
                /** @description Required for tenant session requests; bearer keys cannot override their workspace. */
                "X-Workspace-Id"?: string;
                /** @description Keep the same key and exact payload during uncertain recovery; mismatch409. Raw key secret is never stored in receipts. */
                "Idempotency-Key": string;
            };
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                /** @example {} */
                "application/json": components["schemas"]["Empty"];
            };
        };
        responses: {
            /** @description Acknowledged result */
            200: {
                headers: {
                    "X-Request-Id"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["GenericResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            405: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            428: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            429: {
                headers: {
                    /** @description Minimum seconds before retry */
                    "Retry-After"?: string;
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "RATE_LIMITED",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": true
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": true
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    importErrors: {
        parameters: {
            query?: {
                cursor?: number;
            };
            header?: {
                /** @description Required for tenant session requests; bearer keys cannot override their workspace. */
                "X-Workspace-Id"?: string;
            };
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Acknowledged result */
            200: {
                headers: {
                    "X-Request-Id"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["GenericResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            405: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            428: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            429: {
                headers: {
                    /** @description Minimum seconds before retry */
                    "Retry-After"?: string;
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "RATE_LIMITED",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": true
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": true
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    submitCampaignReview: {
        parameters: {
            query?: never;
            header: {
                /** @description Required for tenant session requests; bearer keys cannot override their workspace. */
                "X-Workspace-Id"?: string;
                /** @description Keep the same key and exact payload during uncertain recovery; mismatch409. Raw key secret is never stored in receipts. */
                "Idempotency-Key": string;
            };
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                /** @example {} */
                "application/json": components["schemas"]["Empty"];
            };
        };
        responses: {
            /** @description Acknowledged result */
            200: {
                headers: {
                    "X-Request-Id"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CampaignResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            405: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            428: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            429: {
                headers: {
                    /** @description Minimum seconds before retry */
                    "Retry-After"?: string;
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "RATE_LIMITED",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": true
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": true
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    approveCampaign: {
        parameters: {
            query?: never;
            header: {
                /** @description Required for tenant session requests; bearer keys cannot override their workspace. */
                "X-Workspace-Id"?: string;
                /** @description Keep the same key and exact payload during uncertain recovery; mismatch409. Raw key secret is never stored in receipts. */
                "Idempotency-Key": string;
            };
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                /** @example {} */
                "application/json": components["schemas"]["Empty"];
            };
        };
        responses: {
            /** @description Reserved shape; the current development command always returns a documented provider/release error. */
            200: {
                headers: {
                    "X-Request-Id"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CampaignResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            405: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            428: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            429: {
                headers: {
                    /** @description Minimum seconds before retry */
                    "Retry-After"?: string;
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "RATE_LIMITED",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": true
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": true
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    sendCampaign: {
        parameters: {
            query?: never;
            header: {
                /** @description Required for tenant session requests; bearer keys cannot override their workspace. */
                "X-Workspace-Id"?: string;
                /** @description Keep the same key and exact payload during uncertain recovery; mismatch409. Raw key secret is never stored in receipts. */
                "Idempotency-Key": string;
            };
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                /** @example {} */
                "application/json": components["schemas"]["Empty"];
            };
        };
        responses: {
            /** @description Reserved shape; the current development command always returns a documented provider/release error. */
            200: {
                headers: {
                    "X-Request-Id"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CampaignResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            405: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            428: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            429: {
                headers: {
                    /** @description Minimum seconds before retry */
                    "Retry-After"?: string;
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "RATE_LIMITED",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": true
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": true
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    scheduleCampaign: {
        parameters: {
            query?: never;
            header: {
                /** @description Required for tenant session requests; bearer keys cannot override their workspace. */
                "X-Workspace-Id"?: string;
                /** @description Keep the same key and exact payload during uncertain recovery; mismatch409. Raw key secret is never stored in receipts. */
                "Idempotency-Key": string;
            };
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                /** @example {} */
                "application/json": components["schemas"]["Empty"];
            };
        };
        responses: {
            /** @description Reserved shape; the current development command always returns a documented provider/release error. */
            200: {
                headers: {
                    "X-Request-Id"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CampaignResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            405: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            428: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            429: {
                headers: {
                    /** @description Minimum seconds before retry */
                    "Retry-After"?: string;
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "RATE_LIMITED",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": true
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": true
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    pauseCampaign: {
        parameters: {
            query?: never;
            header: {
                /** @description Required for tenant session requests; bearer keys cannot override their workspace. */
                "X-Workspace-Id"?: string;
                /** @description Keep the same key and exact payload during uncertain recovery; mismatch409. Raw key secret is never stored in receipts. */
                "Idempotency-Key": string;
            };
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                /** @example {} */
                "application/json": components["schemas"]["Empty"];
            };
        };
        responses: {
            /** @description Acknowledged result */
            200: {
                headers: {
                    "X-Request-Id"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CampaignResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            405: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            428: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            429: {
                headers: {
                    /** @description Minimum seconds before retry */
                    "Retry-After"?: string;
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "RATE_LIMITED",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": true
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": true
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    resumeCampaign: {
        parameters: {
            query?: never;
            header: {
                /** @description Required for tenant session requests; bearer keys cannot override their workspace. */
                "X-Workspace-Id"?: string;
                /** @description Keep the same key and exact payload during uncertain recovery; mismatch409. Raw key secret is never stored in receipts. */
                "Idempotency-Key": string;
            };
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                /** @example {} */
                "application/json": components["schemas"]["Empty"];
            };
        };
        responses: {
            /** @description Reserved shape; the current development command always returns a documented provider/release error. */
            200: {
                headers: {
                    "X-Request-Id"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CampaignResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            405: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            428: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            429: {
                headers: {
                    /** @description Minimum seconds before retry */
                    "Retry-After"?: string;
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "RATE_LIMITED",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": true
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": true
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    cancelCampaign: {
        parameters: {
            query?: never;
            header: {
                /** @description Required for tenant session requests; bearer keys cannot override their workspace. */
                "X-Workspace-Id"?: string;
                /** @description Keep the same key and exact payload during uncertain recovery; mismatch409. Raw key secret is never stored in receipts. */
                "Idempotency-Key": string;
            };
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                /** @example {} */
                "application/json": components["schemas"]["Empty"];
            };
        };
        responses: {
            /** @description Acknowledged result */
            200: {
                headers: {
                    "X-Request-Id"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CampaignResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            405: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            428: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            429: {
                headers: {
                    /** @description Minimum seconds before retry */
                    "Retry-After"?: string;
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "RATE_LIMITED",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": true
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": true
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    rotateApiKey: {
        parameters: {
            query?: never;
            header: {
                /** @description Required for tenant session requests; bearer keys cannot override their workspace. */
                "X-Workspace-Id"?: string;
                /** @description Keep the same key and exact payload during uncertain recovery; mismatch409. Raw key secret is never stored in receipts. */
                "Idempotency-Key": string;
            };
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                /** @example {} */
                "application/json": components["schemas"]["Empty"];
            };
        };
        responses: {
            /** @description Acknowledged result */
            200: {
                headers: {
                    "X-Request-Id"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["KeyResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            405: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            428: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            429: {
                headers: {
                    /** @description Minimum seconds before retry */
                    "Retry-After"?: string;
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "RATE_LIMITED",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": true
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": true
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    revokeApiKey: {
        parameters: {
            query?: never;
            header: {
                /** @description Required for tenant session requests; bearer keys cannot override their workspace. */
                "X-Workspace-Id"?: string;
                /** @description Keep the same key and exact payload during uncertain recovery; mismatch409. Raw key secret is never stored in receipts. */
                "Idempotency-Key": string;
            };
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                /** @example {} */
                "application/json": components["schemas"]["Empty"];
            };
        };
        responses: {
            /** @description Acknowledged result */
            200: {
                headers: {
                    "X-Request-Id"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["GenericResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            405: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            428: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            429: {
                headers: {
                    /** @description Minimum seconds before retry */
                    "Retry-After"?: string;
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "RATE_LIMITED",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": true
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": true
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    getUsage: {
        parameters: {
            query?: never;
            header?: {
                /** @description Required for tenant session requests; bearer keys cannot override their workspace. */
                "X-Workspace-Id"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Acknowledged result */
            200: {
                headers: {
                    "X-Request-Id"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["GenericResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            405: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            428: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            429: {
                headers: {
                    /** @description Minimum seconds before retry */
                    "Retry-After"?: string;
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "RATE_LIMITED",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": true
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Safe error; preserve request ID. Business errors do not automatically retry. */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "request_id": "req-example",
                     *       "error": {
                     *         "code": "STATE_CONFLICT",
                     *         "message": "Resolve the documented request or setup requirement.",
                     *         "retryable": true
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
}
