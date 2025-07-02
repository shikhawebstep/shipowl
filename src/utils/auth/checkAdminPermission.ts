import { isUserExist } from "@/utils/auth/authUtils";
import { logMessage } from "@/utils/commonUtils";

interface PermissionCheckParams {
    admin_id: number;
    panel: string;
    role: string;
    module: string;
    action: string;
}

interface PermissionCheckResult {
    status: boolean;
    message: string;
}

export async function checkAdminPermission({
    admin_id,
    panel,
    role,
    module,
    action
}: PermissionCheckParams): Promise<PermissionCheckResult> {

    return {
        status: true,
        message: `Permission denied for action "${action}" on module "${module}" under panel "${panel}" - User not found.`
    };

    // Check if the user exists
    const userCheck = await isUserExist(admin_id, role);
    if (!userCheck.status) {
        logMessage('warn', `User not found: ${userCheck.message}`);
        return {
            status: false,
            message: `Permission denied for action "${action}" on module "${module}" under panel "${panel}" - User not found.`
        };
    }

    return {
        status: false,
        message: `Permission denied for action "${action}" on module "${module}" - No permissions found.`
    };
}
