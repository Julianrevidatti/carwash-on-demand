import React from 'react';
import { useStore } from '../src/store/useStore';

export const DebugGrace = () => {
    const currentUser = useStore(state => state.currentUser);
    const currentTenant = useStore(state => state.currentTenant);
    const saasClients = useStore(state => state.saasClients);

    if (!currentUser) return <div className="fixed bottom-4 right-4 bg-black/80 text-white p-4 rounded z-50 text-xs">No Current User</div>;

    const myTenant = currentUser.role === 'sysadmin'
        ? saasClients.find(c => c.contactName === currentUser.username)
        : currentTenant;

    if (!myTenant) return (
        <div className="fixed bottom-4 right-4 bg-black/80 text-white p-4 rounded z-50 text-xs">
            <p>User: {currentUser.username}</p>
            <p>Tenant not found</p>
            <p>Role: {currentUser.role}</p>
            <p>CurrentTenant: {currentTenant ? 'Loaded' : 'Null'}</p>
        </div>
    );

    const today = new Date();
    const dueDate = new Date(myTenant.nextDueDate);
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    const gracePeriodStart = myTenant.gracePeriodStart;
    const graceDaysElapsed = gracePeriodStart
        ? Math.ceil((today.getTime() - new Date(gracePeriodStart).getTime()) / (1000 * 60 * 60 * 24))
        : 0;

    const isPaidPlan = myTenant.pricingPlan !== 'FREE';
    const gracePeriodDays = isPaidPlan ? 5 : 0;
    const graceDaysLeft = Math.max(0, gracePeriodDays - graceDaysElapsed);
    const shouldShowModal = diffDays <= 0 && graceDaysLeft > 0 && isPaidPlan;

    return (
        <div className="fixed bottom-4 right-4 bg-black/90 text-white p-4 rounded z-50 text-xs font-mono border border-green-500 shadow-xl max-w-sm overflow-auto max-h-screen">
            <h3 className="font-bold text-green-400 mb-2">🕵️ DEBUG GRACE PERIOD</h3>

            <div className="space-y-1">
                <p><span className="text-gray-400">User:</span> {currentUser.username}</p>
                <p><span className="text-gray-400">Role:</span> {currentUser.role}</p>
                <p><span className="text-gray-400">Tenant:</span> {myTenant.businessName}</p>
                <p><span className="text-gray-400">ID:</span> {myTenant.id}</p>
                <div className="h-px bg-gray-700 my-2"></div>

                <p><span className="text-gray-400">Plan:</span> {myTenant.pricingPlan}</p>
                <p><span className="text-gray-400">Due Date:</span> {myTenant.nextDueDate}</p>
                <p><span className="text-gray-400">Grace Start:</span> {myTenant.gracePeriodStart || 'NULL'}</p>
                <p><span className="text-gray-400">Status:</span> {myTenant.status}</p>
                <div className="h-px bg-gray-700 my-2"></div>

                <p><span className="text-gray-400">Diff Days:</span> {diffDays}</p>
                <p><span className="text-gray-400">Grace Elapsed:</span> {graceDaysElapsed}</p>
                <p><span className="text-gray-400">Grace Left:</span> {graceDaysLeft}</p>
                <p><span className="text-gray-400">Is Paid:</span> {isPaidPlan ? 'YES' : 'NO'}</p>
                <div className="h-px bg-gray-700 my-2"></div>

                <p><span className="text-gray-400">Show Modal:</span>
                    <span className={shouldShowModal ? "text-green-400 font-bold" : "text-red-400 font-bold"}>
                        {shouldShowModal ? 'TRUE' : 'FALSE'}
                    </span>
                </p>
            </div>
        </div>
    );
};
