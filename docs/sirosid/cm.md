---
sidebar_position: 2
---
# Credential Manager

The SIROS ID Credential Manager (CM for short) is a hosted version of the [wwWallet](/wwWallet) opensource wallet. The wwWallet is a flexible digital credential manager that is able to support both native apps as well as web clients. The SIROS ID version of wwWallet can be access on any device and supports all major browsers and platforms.

There is no concept of an "account" in the SIROS ID CM, instead users authenticate to their CM by using FIDO passkeys. The FIDO authenticator is also used to encrypt all data in the users credential store which means that the users credential is safe from tampering. Nobody but the user can access their credentials and the SIROS ID technical staff has no way of knowing what credentials are stored in users CM instances. There are no backdoors into the SIROS ID platform. As an owner of a SIROS ID CM Service you can count the number of users that use your CM Service but you can't peek into their credentials.
