# Launch dependencies requiring the owner

Independent implementation continues. This checklist names genuine account/decision dependencies; it does not authorize purchases or imply production readiness. Configure credentials only through private environment/provider interfaces, never chat or public Git.

| Dependency | Exact missing item | Smallest supported owner action |
| --- | --- | --- |
| Railway destination | Requested workspace `43361b3a-6543-4993-92bc-42fe2457f1c3` is absent from the connected account's workspace list. Only `ba6801a2-2816-4af9-a965-7ffa8be1737f` is visible. | Grant the connected account membership in the requested workspace and refresh Railway; alternatively explicitly name a corrected destination. |
| Infrastructure spending | Monthly infrastructure ceiling and billable-resource approval are unresolved. | State the permitted USD ceiling and approved plan/resources before provisioning. |
| Production identity | Clerk application configuration, callback domain and privately configured keys are absent. | Provide access to the intended existing Clerk app or configure its keys privately for Lettercape. |
| Live AI evaluation | No provider key, approved model or finite funded generation allowance. | Configure the intended OpenAI account privately and approve the model/allowance and spending ceiling. |
| Real-client preview | No service/account providing the PRD's 20-profile client captures. | Identify and authorize an existing preview account, or approve a specific purchase after its cost is presented. |
| ESP and sending conformance | Five ESP export accounts and four sending-provider sandbox/configuration paths remain unconfigured. | Identify intended test accounts and grant only required access. Sender ownership and DNS verification are needed before live delivery. |
| Billing | Stripe account/private configuration and approved price, trial, refund and overage policies are absent. | Identify the intended Stripe test account and approve the product catalogue/policies; configure secrets privately. |
| Legal and operations evidence | Consent/retention/region policy, operational owners, independent security assessment and partner/signoff evidence remain unresolved. | Name responsible approvers and confirm the applicable policies and assessment/partner process. |
| Domain | User intends to buy `lettercape.com`; ownership/DNS access is not yet evidenced. | Complete the purchase independently, then provide supported DNS-management access when deployment reaches domain setup. |

The first current access blocker is Railway workspace membership. No new OAuth grants, credential creation, purchases or marketing campaigns follow merely from willingness to provide access.
