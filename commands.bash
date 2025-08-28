sudo nano /etc/systemd/system/lager.service

sudo systemctl enable lager
sudo systemctl daemon-reload

sudo systemctl start lager
sudo systemctl status lager.service
sudo systemctl stop lager

sudo journalctl -u lager -f