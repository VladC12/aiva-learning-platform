import {
    StorageSharedKeyCredential,
    ContainerSASPermissions,
    generateBlobSASQueryParameters,
    BlobSASSignatureValues,
} from "@azure/storage-blob";

export interface SasOptions extends BlobSASSignatureValues {
    containerName: string;
    permissions: ContainerSASPermissions;
    contentDisposition: string;
}

export const getContainerSas = (
    containerName: string,
    sharedKeyCredential: StorageSharedKeyCredential,
    storedPolicyName: string | null,
    permission: ContainerSASPermissions,
    contentDisposition: string,
    expiresOn: Date = new Date(new Date().valueOf() + 10 * 60 * 1000) // 10 minutes
): string => {
    const sasOptions: SasOptions = {
        containerName: containerName,
        permissions: permission,
        contentDisposition: contentDisposition,
        startsOn: new Date(),
        expiresOn: expiresOn,
    };

    if (storedPolicyName) {
        sasOptions.identifier = storedPolicyName;
    }

    return generateBlobSASQueryParameters(
        sasOptions,
        sharedKeyCredential
    ).toString();
};