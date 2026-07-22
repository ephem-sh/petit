#!/usr/bin/env node
import { defineCommand, runMain } from "citty"
import { devCommand } from "./dev"
import { buildCommand } from "./build"
import { initCommand } from "./init"
import { configCommand } from "./config"
import { exportCommand } from "./export"
import { checkCommand } from "./check"

/** Main CLI command for petit */
const main = defineCommand({
	meta: {
		name: "petit",
		description: "Small local-first documentation",
	},
	args: {
		config: {
			type: "string",
			description: "Path to config file",
			required: false,
		},
	},
	subCommands: {
		dev: devCommand,
		build: buildCommand,
		init: initCommand,
		config: configCommand,
		export: exportCommand,
		check: checkCommand,
	},
})

runMain(main)
