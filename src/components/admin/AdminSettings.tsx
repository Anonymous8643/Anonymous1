import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Gift, MapPin, Phone, Mail, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { usePlatformSettings, useUpdatePlatformSetting } from "@/hooks/useAdmin";
import { useToast } from "@/hooks/use-toast";

export const AdminSettings = () => {
  const { data: platformSettings } = usePlatformSettings();
  const updateSetting = useUpdatePlatformSetting();
  const { toast } = useToast();

  // Welcome bonus state
  const [welcomeBonus, setWelcomeBonus] = useState("50");
  
  // Office contact state
  const [officePhone, setOfficePhone] = useState("+254 700 123 456");
  const [officeEmail, setOfficeEmail] = useState("support@investermate.co.ke");

  // Load current settings
  useEffect(() => {
    if (platformSettings) {
      const welcomeBonusSetting = platformSettings.find((s) => s.key === "welcome_bonus");
      const welcomeBonusValue = welcomeBonusSetting?.value as Record<string, unknown> | undefined;
      if (welcomeBonusValue?.amount) {
        setWelcomeBonus(String(welcomeBonusValue.amount));
      }
      
      const officeContactSetting = platformSettings.find((s) => s.key === "office_contact");
      const officeContactValue = officeContactSetting?.value as Record<string, unknown> | undefined;
      if (officeContactValue) {
        if (officeContactValue.phone) {
          setOfficePhone(String(officeContactValue.phone));
        }
        if (officeContactValue.email) {
          setOfficeEmail(String(officeContactValue.email));
        }
      }
    }
  }, [platformSettings]);

  const handleSaveWelcomeBonus = () => {
    const amount = Number(welcomeBonus);
    if (isNaN(amount) || amount < 0) {
      toast({ variant: "destructive", title: "Invalid amount", description: "Please enter a valid number" });
      return;
    }
    
    updateSetting.mutate({
      key: "welcome_bonus",
      value: { amount, enabled: amount > 0 },
    }, {
      onSuccess: () => toast({ title: "Welcome bonus updated", description: `New users will receive KES ${amount}` }),
      onError: () => toast({ variant: "destructive", title: "Error", description: "Failed to update welcome bonus" }),
    });
  };

  const handleSaveOfficeContact = () => {
    updateSetting.mutate({
      key: "office_contact",
      value: { phone: officePhone, email: officeEmail },
    }, {
      onSuccess: () => toast({ title: "Office contact updated", description: "About Us page will show new contact details" }),
      onError: () => toast({ variant: "destructive", title: "Error", description: "Failed to update office contact" }),
    });
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-5"
      >
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Settings className="w-5 h-5 text-primary" />
          App Configuration
        </h3>

        {/* Welcome Bonus Setting */}
        <div className="p-4 rounded-lg bg-muted/30 space-y-4 mb-4">
          <div className="flex items-center gap-2">
            <Gift className="w-5 h-5 text-profit" />
            <span className="font-medium">Welcome Bonus Amount</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Amount (in KES) that new users receive upon first registration. Set to 0 to disable.
          </p>
          <div className="flex gap-2">
            <div className="flex-1">
              <Label htmlFor="welcomeBonus" className="text-xs text-muted-foreground">Amount (KES)</Label>
              <Input
                id="welcomeBonus"
                type="number"
                min="0"
                placeholder="50"
                value={welcomeBonus}
                onChange={(e) => setWelcomeBonus(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button 
                onClick={handleSaveWelcomeBonus}
                disabled={updateSetting.isPending}
              >
                Save
              </Button>
            </div>
          </div>
        </div>

        {/* Office Contact Setting */}
        <div className="p-4 rounded-lg bg-muted/30 space-y-4">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-trust" />
            <span className="font-medium">Office Contact Details</span>
          </div>
          <p className="text-xs text-muted-foreground">
            These details are displayed on the About Us page.
          </p>
          
          <div className="space-y-3">
            <div>
              <Label htmlFor="officePhone" className="text-xs text-muted-foreground flex items-center gap-1">
                <Phone className="w-3 h-3" /> Phone Number
              </Label>
              <Input
                id="officePhone"
                type="tel"
                placeholder="+254 700 123 456"
                value={officePhone}
                onChange={(e) => setOfficePhone(e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="officeEmail" className="text-xs text-muted-foreground flex items-center gap-1">
                <Mail className="w-3 h-3" /> Email Address
              </Label>
              <Input
                id="officeEmail"
                type="email"
                placeholder="support@investermate.co.ke"
                value={officeEmail}
                onChange={(e) => setOfficeEmail(e.target.value)}
              />
            </div>
            
            <Button 
              onClick={handleSaveOfficeContact}
              disabled={updateSetting.isPending}
              className="w-full"
            >
              Save Contact Details
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
