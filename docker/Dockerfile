FROM osrf/ros:noetic-desktop-full

# Basic tools and dependencies and nodejs LTS PPA.
RUN apt update && apt install -y curl git python3-pip 
# RUN apt install -y vim
# Install Nodejs (May need to update the version)
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash - && sudo apt-get install -y nodejs
RUN npm install -g npm

# Install rvizweb.
WORKDIR /rvizweb_ws
ARG rvizweb_branch=master
# Clone the from your own or other developer's forked Repo (Since the offical Repos does not support noetic)
RUN git clone https://github.com/yxzhan/rvizweb.git src/rvizweb -b ${rvizweb_branch}
RUN pip install cbor2
RUN rosdep install --from-paths src --ignore-src -r -y
RUN . /opt/ros/noetic/setup.sh && catkin_make
# Clear apt cache.
RUN apt clean

RUN echo "source /rvizweb_ws/devel/setup.bash" >> /root/.bashrc

# EXPOSE 8000-10000
ENTRYPOINT ["/bin/bash", "-c", "source /rvizweb_ws/devel/setup.bash && roslaunch rvizweb rvizweb.launch"]
