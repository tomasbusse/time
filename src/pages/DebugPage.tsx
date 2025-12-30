import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth, useUser } from "@clerk/clerk-react";
import { useState } from "react";
import { Id } from "../../convex/_generated/dataModel";

export default function DebugPage() {
    const { isLoaded, isSignedIn, user } = useUser();
    const { signOut } = useAuth();

    const workspaces = useQuery(api.fixWorkspace.listAllWorkspaces);
    const convexUser = useQuery(api.users.getCurrentUser);
    const grantAccess = useMutation(api.fixWorkspace.grantAccessToWorkspace);
    const createWorkspace = useMutation(api.fixWorkspace.createWorkspaceForUser);

    const [loadingId, setLoadingId] = useState<Id<"workspaces"> | null>(null);
    const [message, setMessage] = useState("");
    const [tokenClaims, setTokenClaims] = useState<any>(null);

    const checkToken = async () => {
        try {
            // @ts-ignore
            const token = await window.Clerk?.session?.getToken({ template: "convex" });
            if (!token) {
                setTokenClaims("No token generated");
                return;
            }
            const payload = JSON.parse(atob(token.split('.')[1]));
            setTokenClaims(payload);
        } catch (e: any) {
            setTokenClaims(`Error: ${e.message}`);
        }
    };

    if (!isLoaded) return <div className="p-8">Loading Clerk...</div>;

    if (!isSignedIn) {
        return (
            <div className="p-8">
                <h1 className="text-2xl font-bold mb-4">You are not logged in</h1>
                <a href="/login" className="text-blue-600 underline">Go to Login</a>
            </div>
        );
    }

    const handleClaim = async (workspaceId: Id<"workspaces">) => {
        setLoadingId(workspaceId);
        try {
            await grantAccess({ workspaceId });
            setMessage("Success! You should now have access. Go to Dashboard.");
        } catch (e: any) {
            setMessage(`Error: ${e.message}`);
        } finally {
            setLoadingId(null);
        }
    };

    const handleCreateNew = async () => {
        try {
            await createWorkspace();
            setMessage("Created new workspace successfully.");
        } catch (e: any) {
            setMessage(`Error creating: ${e.message}`);
        }
    }

    return (
        <div className="max-w-4xl mx-auto p-8 bg-white min-h-screen">
            <h1 className="text-3xl font-bold mb-6 text-red-600">Debug & Recovery Console</h1>

            <div className="bg-gray-100 p-6 rounded-lg mb-8">
                <h2 className="text-xl font-semibold mb-2">Current Identity</h2>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <p className="text-sm text-gray-500">Clerk Email</p>
                        <p className="font-mono">{user?.primaryEmailAddress?.emailAddress}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Clerk ID</p>
                        <p className="font-mono">{user?.id}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Convex DB User</p>
                        <p className="font-mono">
                            {convexUser ? (
                                <span className="text-green-600">Found ({convexUser._id})</span>
                            ) : (
                                <span className="text-red-600">Not Found in DB</span>
                            )}
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => signOut()}
                    className="mt-4 px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded"
                >
                    Sign Out
                </button>
            </div>

            <div className="bg-yellow-50 p-6 rounded-lg mb-8 border border-yellow-200">
                <h2 className="text-xl font-semibold mb-2">Auth Debugger</h2>
                <p className="mb-4 text-sm text-gray-600">
                    If you see "No auth provider found" errors, click below to see what your token looks like.
                    The "iss" (Issuer) field must match your Convex Env Var.
                </p>
                <button
                    onClick={checkToken}
                    className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
                >
                    Inspect Token
                </button>
                {tokenClaims && (
                    <pre className="mt-4 p-4 bg-gray-800 text-green-400 rounded overflow-auto text-xs">
                        {JSON.stringify(tokenClaims, null, 2)}
                    </pre>
                )}
            </div>

            {message && (
                <div className="p-4 mb-6 bg-blue-50 border border-blue-200 rounded text-blue-800">
                    {message}
                </div>
            )}

            <div className="mb-8">
                <h2 className="text-xl font-semibold mb-4">Available Workspaces</h2>
                {workspaces === undefined ? (
                    <p>Loading workspaces...</p>
                ) : (
                    <div className="space-y-4">
                        {workspaces.map((ws) => (
                            <div key={ws._id} className="border p-4 rounded flex justify-between items-center bg-gray-50 hover:bg-white transition-colors">
                                <div>
                                    <h3 className="font-bold text-lg">{ws.name}</h3>
                                    <p className="text-sm text-gray-600">
                                        Created: {new Date(ws.createdAt).toLocaleDateString()}
                                    </p>
                                    <p className="text-sm text-gray-600">
                                        Owner: {ws.ownerName} ({ws.ownerEmail})
                                    </p>
                                    <p className="text-xs text-gray-400 font-mono">{ws._id}</p>
                                </div>
                                <button
                                    onClick={() => handleClaim(ws._id)}
                                    disabled={!!loadingId}
                                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                                >
                                    {loadingId === ws._id ? "Claiming..." : "Claim Access"}
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="pt-8 border-t">
                <h2 className="text-xl font-semibold mb-4">Advanced</h2>
                <button onClick={handleCreateNew} className="text-sm underline text-gray-500">
                    Force Create New Workspace
                </button>
            </div>

            <div className="mt-8">
                <a href="/" className="text-blue-600 hover:underline">← Back to Dashboard</a>
            </div>
        </div>
    );
}
