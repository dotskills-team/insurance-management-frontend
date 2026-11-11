"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Power, ShieldAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import {
  useGetSiteSettingQuery,
  useUpdateSiteSettingMutation,
} from "@/redux/features/siteSetting/siteSetting.api";

const SiteSettingManagement = () => {
  const { data, isLoading } = useGetSiteSettingQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });
  const [updateSetting, { isLoading: isSaving }] =
    useUpdateSiteSettingMutation();

  // The value the admin is about to apply; non-null while the confirm dialog is open
  const [pendingValue, setPendingValue] = useState<boolean | null>(null);

  const staffAccessEnabled = data?.data?.staffAccessEnabled ?? true;
  const updatedBy = data?.data?.updatedBy;
  const updatedAt = data?.data?.updatedAt;

  const handleConfirm = async () => {
    if (pendingValue === null) return;

    try {
      await updateSetting({ staffAccessEnabled: pendingValue }).unwrap();
      toast.success(
        pendingValue ? "Staff access enabled" : "Staff access disabled",
      );
      setPendingValue(null);
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to update site setting");
    }
  };

  return (
    <div className="mx-auto max-w-2xl p-4 md:p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Power className="h-5 w-5" />
            Staff Access
          </CardTitle>
          <CardDescription>
            Turn the system off for staff. While it is off, only customers,
            admins and super admins can log in. Managers, claims staff, A.A.
            managers, agent leaders and agents are blocked, and staff who are
            already logged in lose access as well.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-1">
                  <p className="font-medium">
                    Staff access is{" "}
                    <span
                      className={
                        staffAccessEnabled
                          ? "text-emerald-600"
                          : "text-red-600"
                      }
                    >
                      {staffAccessEnabled ? "ON" : "OFF"}
                    </span>
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {staffAccessEnabled
                      ? "All roles can log in."
                      : "Staff cannot log in. Customers and admins are unaffected."}
                  </p>
                </div>

                <Switch
                  checked={staffAccessEnabled}
                  disabled={isSaving}
                  onCheckedChange={(checked: boolean) =>
                    setPendingValue(checked)
                  }
                />
              </div>

              {updatedAt && (
                <p className="text-xs text-muted-foreground">
                  Last updated: {new Date(updatedAt).toLocaleString()}
                  {updatedBy?.name ? ` by ${updatedBy.name}` : ""}
                </p>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={pendingValue !== null}
        onOpenChange={(open) => {
          if (!open && !isSaving) setPendingValue(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5" />
              {pendingValue ? "Enable staff access?" : "Disable staff access?"}
            </DialogTitle>
            <DialogDescription>
              {pendingValue
                ? "Staff will be able to log in and use the system again."
                : "All staff will be blocked from logging in and any active staff session will stop working. Customers, admins and super admins are not affected."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPendingValue(null)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              variant={pendingValue ? "default" : "destructive"}
              onClick={handleConfirm}
              disabled={isSaving}
            >
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {pendingValue ? "Enable" : "Disable"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SiteSettingManagement;
