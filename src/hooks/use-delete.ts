import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

interface UseDeleteOptions {
    onSuccess?: () => void;
    successMessage?: string;
    confirmMessage?: string;
    requireConfirmation?: boolean;
}

export function useDelete() {
    const { toast } = useToast();
    const [isDeleting, setIsDeleting] = useState(false);

    const deleteItem = async (
        deleteFn: () => Promise<void>,
        options: UseDeleteOptions = {}
    ) => {
        const {
            successMessage = "Item deleted",
            onSuccess,
            requireConfirmation = false,
            confirmMessage = "Are you sure you want to delete this item?"
        } = options;

        if (requireConfirmation && !window.confirm(confirmMessage)) {
            return;
        }

        setIsDeleting(true);
        try {
            await deleteFn();
            toast({ title: "Success", description: successMessage });
            onSuccess?.();
        } catch (error) {
            console.error("Delete failed:", error);
            toast({
                variant: "destructive",
                title: "Delete Failed",
                description: "An error occurred while deleting the item."
            });
        } finally {
            setIsDeleting(false);
        }
    };

    return { deleteItem, isDeleting };
}
