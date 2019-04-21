/*!
 * Copyright 2018-2019 VMware, Inc.
 * SPDX-License-Identifier: MIT
 */

import { Logger } from "vrealize-common"
import * as vscode from "vscode"

import { Commands } from "../constants"
import { ConfigurationManager } from "../system"

export class ClientWindow implements vscode.Disposable {
    private readonly logger = Logger.get("ClientWindow")
    private readonly collectionButton: vscode.StatusBarItem
    private readonly collectionStatus: vscode.StatusBarItem

    profileName: string | undefined

    constructor(initialProfileName: string | undefined) {
        this.logger.debug("Instantiating the client window")

        this.collectionStatus = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 10101)
        this.collectionButton = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 10100)

        this.collectionStatus.text = "$(plug) $(kebab-horizontal)"
        this.profileName = initialProfileName

        this.collectionStatus.show()
    }

    dispose() {
        this.collectionButton.dispose()
        this.collectionStatus.dispose()
    }

    verifyConfiguration(config: ConfigurationManager): boolean {
        this.profileName = config.hasActiveProfile() ? config.activeProfile.get("id") : undefined
        this.logger.info(`Verifying configuration for active profile ${this.profileName}`)

        const serverConfIsValid = !!this.profileName
        if (serverConfIsValid) {
            this.collectionButton.show()

            this.collectionButton.text = "$(cloud-download)"
            this.collectionButton.command = Commands.TriggerServerCollection
            this.collectionButton.tooltip = "Trigger vRO hint collection"
            this.collectionButton.color = undefined

            const hostname = config.activeProfile.get("vro.host")
            this.collectionStatus.text = `$(server) ${this.profileName} (${hostname})`
            this.collectionStatus.tooltip = "Change active profile"
            this.collectionStatus.command = Commands.ChangeProfile

            return true
        }

        const warnMessage = "A vRO maven profile is missing or incomplete."
        this.logger.warn(warnMessage)

        this.collectionButton.hide()

        this.collectionStatus.text = "$(server) $(x)"
        this.collectionStatus.tooltip = warnMessage
        this.collectionStatus.command = Commands.ChangeProfile

        return false
    }

    onCollectionStart() {
        this.collectionButton.text = "$(watch) "
        this.collectionButton.command = undefined
        this.collectionButton.tooltip = undefined
        this.collectionButton.color = undefined
    }

    onCollectionSuccess() {
        this.collectionButton.text = "$(cloud-download)"
        this.collectionButton.command = Commands.TriggerServerCollection
        this.collectionButton.tooltip = "Trigger vRO hint collection"
        this.collectionButton.color = undefined
    }

    onCollectionError(message: string) {
        this.collectionButton.text = "$(alert)"
        this.collectionButton.command = Commands.TriggerServerCollection
        this.collectionButton.tooltip = `Collection failed: ${message}`
        this.collectionButton.color = new vscode.ThemeColor("errorForeground")

        const errorMessage = `Hint collection failed - ${message}`
        this.logger.error(errorMessage)

        vscode.window.showErrorMessage(errorMessage, "Retry").then(selected => {
            if (selected === "Retry") {
                vscode.commands.executeCommand(Commands.TriggerServerCollection)
            }
        })
    }
}
